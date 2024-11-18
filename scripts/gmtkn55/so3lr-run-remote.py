import modal
from typing import List, Dict, Any, Optional
import csv
import cctk
import io
import yaml

app = modal.App("so3lr-benchmark")

so3lr_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .run_commands(
        "git clone https://github.com/general-molecular-simulations/so3lr.git"
    )
    .workdir("so3lr")
    .run_commands("pip install .")
    .pip_install("cctk", "tensorflow", "tensorflow-datasets")
    .run_commands(
        'pip install "jax[cuda12_pip]" -f https://storage.googleapis.com/jax-releases/jax_cuda_releases.html',
    )
)


@app.function(image=so3lr_image, gpu="A10G")
def eval_benchmark(
    structure_dict: Dict[str, Any],
    subsets: Optional[List[str]] = None,
    skip_subsets: Optional[List[str]] = None,
    allowed_multiplicity: Optional[List[int]] = None,
    allowed_charge: Optional[List[int]] = None,
    allowed_elements: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Evaluate the GMTKN55 benchmark at the given level of theory.

    :param yaml_path: the path to the YAML file containing the GMTKN55 data
    :param csv_out_path: the path to the CSV output file
    :param subsets: which subsets to run
    """
    from so3lr import So3lrCalculator
    import ase
    import copy
    import numpy as np

    def _should_run_system(
        system: Dict[str, Any],
        allowed_elements: Optional[List[int]],
        allowed_multiplicity: Optional[List[int]],
        allowed_charge: Optional[List[int]],
    ) -> bool:
        """
        Check if a system meets the filtering criteria.
        """
        for species in system["Species"].values():
            elements = [
                cctk.helper_functions.get_number(e) for e in species["Elements"]
            ]
            multiplicity = species["UHF"] + 1
            charge = species["Charge"]

            if allowed_elements and any(el not in allowed_elements for el in elements):
                return False
            if allowed_multiplicity and multiplicity not in allowed_multiplicity:
                return False
            if allowed_charge and charge not in allowed_charge:
                return False

        return True

    overall_errors = []
    overall_weights = []
    calculator = So3lrCalculator(calculate_stress=False, dtype=np.float32)

    csv_output = io.StringIO()
    csv_writer = csv.writer(csv_output)
    csv_writer.writerow(["Subset", "MAE", "Completed"])

    for subset_name, subset in structure_dict.items():
        if subsets and subset_name not in subsets:
            continue
        if skip_subsets and subset_name in skip_subsets:
            continue

        print(f"Processing subset: {subset_name}")
        subset_results = {"name": subset_name, "mae": None, "completed": False}
        subset_errors = []
        weights = []

        for system_name, system in subset.items():
            ref_value = system["Energy"]
            weight = system["Weight"]

            if not _should_run_system(
                system, allowed_elements, allowed_multiplicity, allowed_charge
            ):
                break

            try:
                comp_value = 0
                for species_name, species in system["Species"].items():
                    atoms = ase.Atoms(
                        np.array(species["Elements"]), positions=np.array(species["Positions"])
                    )
                    atoms.calc = copy.deepcopy(calculator)
                    result = atoms.get_potential_energy()
                    comp_value += (
                        result * species["Count"] * 23.0609
                    )  # kcal/mol conversion

                error = ref_value - comp_value
                weights.append(weight)
                subset_errors.append(error)
                print(
                    f"\t{system_name}: ref={ref_value:.3f}, comp={comp_value:.3f}, error={error:.3f}"
                )

            except Exception as e:
                print(f"Error in system {system_name}, skipping. Exception: {e}")

        subset_results.update(
            {
                "mae": np.mean(np.abs(subset_errors)) if subset_errors else None,
                "completed": len(subset_errors) == len(subset.items()),
            }
        )

        csv_writer.writerow(
            [subset_results["name"], subset_results["mae"], subset_results["completed"]]
        )

        overall_errors.extend(subset_errors)
        overall_weights.extend(weights)

    wtmad = np.average(np.abs(overall_errors), weights=overall_weights)
    print(f"WTMAD: {wtmad:.3f}")

    return {"WTMAD": wtmad, "CSV": csv_output.getvalue()}


@app.local_entrypoint()
def main():
    with open("GMTKN55.yaml", "r") as file:
        structure_dict = yaml.safe_load(file)

    allowed_elements = [1, 6, 7, 8, 9, 15, 16, 17]  # Define allowed elements if needed

    result = eval_benchmark.remote(
        structure_dict=structure_dict,
        subsets=["Amino20x4"],  # Specify subsets if needed
        skip_subsets=[],
        allowed_multiplicity=[1],
        allowed_charge=[0],
        allowed_elements=allowed_elements,
    )
    print(f"WTMAD: {result['WTMAD']:.3f}")
    print(f"CSV Output:\n{result['CSV']}")

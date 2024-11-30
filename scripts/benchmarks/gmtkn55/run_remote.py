import cctk
import csv
import io
import modal
from typing import List, Dict, Any, Optional
import yaml

from gmtkn55 import YAML_PATH
from models.modal_images import nnps

nnp = "aimnet2-new"  # aimnet2-new, so3lr, orb-v2, omat24

app = modal.App("gmtkn55-benchmark")

image = nnps[nnp]["image"]
volume = nnps[nnp]["volume"]


@app.function(
    image=image, gpu="A10G", volumes={"/model": volume} if volume else {}, timeout=600
)
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
    if nnp == "so3lr":
        from so3lr import So3lrCalculator
    elif nnp == "aimnet2-new":
        from aimnet2calc import AIMNet2ASE
    elif nnp == "orb-v2":
        from orb_models.forcefield import pretrained
        from orb_models.forcefield.calculator import ORBCalculator
    elif nnp == "omat24":
        from fairchem.core import OCPCalculator

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

    if nnp == "so3lr":
        calculator = So3lrCalculator(calculate_stress=False, dtype=np.float32)
    elif nnp == "aimnet2-new":
        calculator = AIMNet2ASE("aimnet2")
    elif nnp == "orb-v2":
        orbff = pretrained.orb_v2(device="cuda")  # or orb_d3_v2
        calculator = ORBCalculator(orbff, device="cuda")
    elif nnp == "omat24":
        calculator = OCPCalculator(
            checkpoint_path="/model/eqV2_153M_omat.pt",
            cpu=False,
        )

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
                        np.array(species["Elements"]),
                        positions=np.array(species["Positions"]),
                    )
                    multiplicity = species["UHF"] + 1
                    charge = species["Charge"] + 0

                    if nnp == "so3lr":
                        atoms.set_calculator(copy.deepcopy(calculator))
                        result = atoms.get_potential_energy()
                    elif nnp == "aimnet2-new":
                        atoms.set_calculator(calculator)
                        calculator.set_charge(charge)
                        calculator.set_mult(multiplicity)
                        result = atoms.get_potential_energy()[0]
                    else:
                        atoms.set_calculator(calculator)
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
    with open(YAML_PATH, "r") as file:
        structure_dict = yaml.safe_load(file)

    result = eval_benchmark.remote(
        structure_dict=structure_dict,
        subsets=[],  # Specify subsets if needed
        skip_subsets=[],
        allowed_multiplicity=nnps[nnp]["allowed_multiplicity"],
        allowed_charge=nnps[nnp]["allowed_charge"],
        allowed_elements=nnps[nnp]["allowed_elements"],
    )

    csv_file_path = f"{nnp}-gmtkn55.csv"
    with open(csv_file_path, "w", newline="") as csv_file:
        csv_file.write(result["CSV"])

    print(f"WTMAD: {result['WTMAD']:.3f}")
    print(f"CSV Output saved to {csv_file_path}")

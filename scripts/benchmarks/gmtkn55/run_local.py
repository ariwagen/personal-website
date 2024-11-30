from typing import List, Dict, Any, Optional
import csv

import ase
import cctk
import numpy as np
import yaml

from gmtkn55 import YAML_PATH
from so3lr import So3lrCalculator

def eval_benchmark(
    yaml_path: str,
    csv_out_path: str,
    subsets: Optional[List[str]] = None,
    skip_subsets: Optional[List[str]] = None,
    allowed_multiplicity: Optional[List[int]] = None,
    allowed_charge: Optional[List[int]] = None,
    allowed_elements: Optional[List[int]] = None,
) -> float:
    """
    Evaluate the GMTKN55 benchmark at the given level of theory.

    :param yaml_path: the path to the YAML file containing the GMTKN55 data
    :param csv_out_path: the path to the CSV output file
    :param subsets: which subsets to run
    """
    with open(yaml_path, "r") as file:
        structure_dict = yaml.safe_load(file)

    overall_errors = []
    overall_weights = []

    with open(csv_out_path, "w", newline="") as csv_file:
        csv_writer = csv.writer(csv_file)
        csv_writer.writerow(["Subset", "MAE", "Completed"])  # Header row
        csv_file.flush()  # Ensure the header is written immediately

        for subset_name, subset in structure_dict.items():
            if subsets and subset_name not in subsets:
                continue
            if skip_subsets and subset_name in skip_subsets:
                continue

            print(f"Processing subset: {subset_name}")
            subset_results = {"name": subset_name, "mae": None, "completed": False}
            subset_errors = []
            weights = []
            times = []

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
                            species["Elements"], positions=np.array(species["Positions"])
                        )
                        atoms.cell = None
                        atoms.pbc = False  
                        
                        atoms.calc = So3lrCalculator(
                            calculate_stress=False, dtype=np.float32
                        )

                        result = atoms.get_potential_energy()

                        comp_value += (
                            result * species["Count"] * 23.0609 # * 627.509
                        )  # Convert to kcal/mol

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
            csv_file.flush()  # Ensure the row is written immediately

            overall_errors.extend(subset_errors)
            overall_weights.extend(weights)

    wtmad = np.average(np.abs(overall_errors), weights=overall_weights)
    print(f"WTMAD: {wtmad:.3f}")

    return wtmad


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
        elements = [cctk.helper_functions.get_number(e) for e in species["Elements"]]
        multiplicity = species["UHF"] + 1
        charge = species["Charge"]

        if allowed_elements and any(el not in allowed_elements for el in elements):
            return False
        if allowed_multiplicity and multiplicity not in allowed_multiplicity:
            return False
        if allowed_charge and charge not in allowed_charge:
            return False

    return True


if __name__ == "__main__":
    allowed_elements = [1, 6, 7, 8, 9, 15, 16, 17]  # Define allowed elements if needed

    wtmad = eval_benchmark(
        yaml_path=YAML_PATH,
        csv_out_path="output.csv",  # CSV file path
        subsets=[],  # Specify subsets if needed
        skip_subsets=[
            "Amino20x4", 
            "BHROT27", 
            "FH51", 
            "TAUT15",
            "WCPT18",
            "ISOL24",
            "PCONF21",
            "ALK8",
            "DARC",
            "ICONF",
            "ISO34",
            "UPU23",
            "RG18",
            "DC13",
            "BH76",
            "RSE43",
            "INV24",
            "PX13",
            "RC21",
            "CHB6"
        ],
        allowed_multiplicity=[1],
        allowed_charge=[0],
        allowed_elements=allowed_elements,
    )
    print(f"WTMAD: {wtmad:.3f}")
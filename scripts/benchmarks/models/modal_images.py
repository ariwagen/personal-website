import modal

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

aimnet2_image = (
    modal.Image.micromamba(python_version="3.11")
    .apt_install("git")
    .run_commands(
        "micromamba create -y -n pytorch_env python=3.11 -c conda-forge",
        "micromamba update -n base micromamba",
        "micromamba update -n base --all",
    )
    .run_commands(
        "micromamba install -y pytorch pytorch-cuda=12.1 -c pytorch -c nvidia -c conda-forge"
    )
    .run_commands(
        "micromamba install -y pytorch pytorch-cuda=12.1 -c pytorch -c nvidia -c conda-forge",
        "pip install torch-cluster -f https://data.pyg.org/whl/torch-2.5.0+cu121.html",
        "micromamba install -y -c conda-forge openbabel ase",
        "git clone https://github.com/isayevlab/AIMNet2.git",
    )
    .workdir("AIMNet2")
    .pip_install("cctk")
    .run_commands("python setup.py install")
)

orbv2_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .pip_install("orb-models, cctk")
    .run_commands(
        'pip install "pynanoflann@git+https://github.com/dwastberg/pynanoflann#egg=af434039ae14bedcbb838a7808924d6689274168"',
    )
)

omat24_image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .pip_install("fairchem-core")
    .pip_install("cctk")
    .run_commands(
        "pip install torch-scatter -f https://data.pyg.org/whl/torch-2.4.0+cu121.html",
        "pip install torch-sparse -f https://pytorch-geometric.com/whl/torch-2.4.0+cu121.html",
        "pip install torch-geometric",
    )
)
omat24_volume = modal.Volume.from_name("omat24")

# mace-off23 elements: [1, 6, 7, 8, 9, 15, 16, 17, 35, 53]

nnps = {
    "so3lr": {
        "image": so3lr_image,
        "volume": None,
        "allowed_elements": [1, 6, 7, 8, 9, 15, 16, 17],
        "allowed_multiplicity": [1],
        "allowed_charge": [0],
    },
    "aimnet2-new": {
        "image": aimnet2_image,
        "volume": None,
        "allowed_elements": [
            1,
            5,
            6,
            7,
            8,
            9,
            14,
            15,
            16,
            17,
            33,
            34,
            35,
            53,
        ],
        "allowed_multiplicity": None,
        "allowed_charge": None,
    },
    "orb-v2": {
        "image": orbv2_image,
        "volume": None,
        "allowed_elements": None,
        "allowed_multiplicity": [1],
        "allowed_charge": [0],
    },
    "omat24": {
        "image": omat24_image,
        "volume": omat24_volume,
        "allowed_elements": None,
        "allowed_multiplicity": [1],
        "allowed_charge": [0],
    },
}
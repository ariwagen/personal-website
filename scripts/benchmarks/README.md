# Running GMTKN55

## Virtual Environment

```bash
cd scripts/benchmarks
python3 -m venv venv
python3 -m pip install cctk modal setuptools
```

## Benchmarking NNPs

Add the NNP and its settings to `/models/modal_images.py`.

Set `nnp` and add model interface–specific logic in `gmtkn55/run_remote.py`.

```bash
cd scripts/benchmarks
source venv/bin/activate
modal run gmtkn55/run_remote.py
```

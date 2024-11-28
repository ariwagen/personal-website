import maceoff23 from "./mace-off23-L-gmtkn55.csv";
import omat24 from "./omat24-gmtkn55.csv";
import orbd3v2 from "./orb-d3-v2-gmtkn55.csv";
import orbv2 from "./orb-v2-gmtkn55.csv";
import so3lr from "./so3lr-gmtkn55.csv";
import aimnet2new from "./aimnet2-new-gmtkn55.csv";
import macemp0 from "./mace-mp-0-gmtkn55.csv";
import aimnet2 from "./aimnet2-old-gmtkn55.csv";
import orbnetdenali from "./orbnet-denali-gmtkn55.csv";
import ani2x from "./ani-2x-gmtkn55.csv";
import ani1ccx from "./ani-1ccx-gmtkn55.csv";
import gfn2xtb from "./gfn2-xtb-gmtkn55.csv";
import pbed3bj from "./pbe-d3bj-gmtkn55.csv";
import wb97md3bj from "./wb97m-d3bj-gmtkn55.csv";

const gmtkn55Benchmarks = {
  "MACE-OFF23(L)": {
    benchmark: maceoff23,
    from: "I.B. 2024-11-28",
  },
  "OMat24 eqV2-L": {
    benchmark: omat24,
    from: "Ari 2024-11-25",
  },
  "Orb-d3-v2": {
    benchmark: orbd3v2,
    from: "Ari 2024-11-24",
  },
  "Orb-v2": {
    benchmark: orbv2,
    from: "Ari 2024-11-24",
  },
  SO3LR: {
    benchmark: so3lr,
    from: "Ari 2024-11-16",
  },
  "AIMNet2 (ωB97M-D3, new)": {
    benchmark: aimnet2new,
    from: "Ari 2024-11-18",
  },
  "MACE-MP-0": {
    benchmark: macemp0,
    from: "Ari 2024-10-23",
  },
  "AIMNet2 (ωB97M-D3, old)": {
    benchmark: aimnet2,
    from: "Ari 2024-10-23",
  },
  "OrbNet Denali": {
    benchmark: orbnetdenali,
    from: "https://arxiv.org/abs/2107.00299",
  },
  "ANI-2x": {
    benchmark: ani2x,
    from: "https://arxiv.org/abs/2107.00299",
  },
  "ANI-1ccx": {
    benchmark: ani1ccx,
    from: "https://arxiv.org/abs/2107.00299",
  },
  // references levels of theory
  "GFN2-xTB": {
    benchmark: gfn2xtb,
    from: "https://arxiv.org/abs/2107.00299",
    reference: true,
  },
  "PBE-D3(BJ)/def2-QZVP": {
    benchmark: pbed3bj,
    from: "https://pubs.rsc.org/en/content/articlelanding/2017/cp/c7cp04913g",
    reference: true,
  },
  "ωB97M-D3(BJ)/def2-QZVP": {
    benchmark: wb97md3bj,
    from: "https://pubs.acs.org/doi/10.1021/acs.jctc.8b00842",
    reference: true,
  },
};

export default gmtkn55Benchmarks;

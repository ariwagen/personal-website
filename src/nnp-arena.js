import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import nnps from './data/nnps.csv';
import gmtkn55Subsets from './data/gmtkn55/subsets.csv';

import omat24 from './data/gmtkn55/omat24-gmtkn55.csv';
import orbd3v2 from './data/gmtkn55/orb-d3-v2-gmtkn55.csv';
import orbv2 from './data/gmtkn55/orb-v2-gmtkn55.csv';
import so3lr from './data/gmtkn55/so3lr-gmtkn55.csv';
import aimnet2new from './data/gmtkn55/aimnet2-new-gmtkn55.csv';
import macemp0 from './data/gmtkn55/mace-mp-0-gmtkn55.csv';
import aimnet2 from './data/gmtkn55/aimnet2-old-gmtkn55.csv';
import orbnetdenali from './data/gmtkn55/orbnet-denali-gmtkn55.csv';
import ani2x from './data/gmtkn55/ani-2x-gmtkn55.csv';
import ani1ccx from './data/gmtkn55/ani-1ccx-gmtkn55.csv';

import gfn2xtb from './data/gmtkn55/gfn2-xtb-gmtkn55.csv';
import pbed3bj from './data/gmtkn55/pbe-d3bj-gmtkn55.csv';
import wb97md3bj from './data/gmtkn55/wb97m-d3bj-gmtkn55.csv';

const gmtkn55Benchmarks = {
  "OMat24 eqV2-L": {
    benchmark: omat24,
    from: "Ari 2024-11-25"
  },
  "Orb-d3-v2": {
    benchmark: orbd3v2,
    from: "Ari 2024-11-24"
  },
  "Orb-v2": {
    benchmark: orbv2,
    from: "Ari 2024-11-24"
  },
  "SO3LR": {
    benchmark: so3lr,
    from: "Ari 2024-11-16"
  },
  "AIMNet2 (ωB97M-D3, new)": {
    benchmark: aimnet2new,
    from: "Ari 2024-11-18"
  },
  "MACE-MP-0": {
    benchmark: macemp0,
    from: "Ari 2024-10-23"
  },
  "AIMNet2 (ωB97M-D3, old)": {
    benchmark: aimnet2,
    from: "Ari 2024-10-23"
  },
  "OrbNet Denali": {
    benchmark: orbnetdenali,
    from: "https://arxiv.org/abs/2107.00299"
  },
  "ANI-2x": {
    benchmark: ani2x,
    from: "https://arxiv.org/abs/2107.00299"
  },
  "ANI-1ccx": {
    benchmark: ani1ccx,
    from: "https://arxiv.org/abs/2107.00299"
  },
  // references levels of theory
  "GFN2-xTB": {
    benchmark: gfn2xtb,
    from: "https://arxiv.org/abs/2107.00299",
    reference: true
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
  }
};

const GMTKN55 = () => {
  const subsetCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "subset");
  const descriptionCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "description");
  const numCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "num");
  const weightCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "weight");
  const categoryCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "category");
  const excludedCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "excluded");

  const calculateWeightedMAE = (benchmark, category) => {
    let totalWeightedMAE = 0;
    let totalWeight = 0;

    const filteredRows = gmtkn55Subsets.filter(row => row[excludedCol].toLowerCase() !== "true"
      ? (category === "All" ? true : row[categoryCol] === category)
      : false);
    const filteredSubsets = filteredRows.map(row => row[subsetCol].toLowerCase());

    const benchmarkSubsetCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "subset");
    const benchmarkCompletedCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "completed");
    const benchmarkMaeCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "mae");

    benchmark.forEach((benchmarkRow, i) => {
      if (i === 0) return; // ignore headers
      const currentSubset = benchmarkRow[benchmarkSubsetCol].toLowerCase();
      if (filteredSubsets.includes(currentSubset) && benchmarkRow[benchmarkCompletedCol].toLowerCase() === 'true') {
        const weight = parseFloat(gmtkn55Subsets.find(row => row[subsetCol].toLowerCase() === currentSubset)[weightCol]);
        const num = parseFloat(gmtkn55Subsets.find(row => row[subsetCol].toLowerCase() === currentSubset)[numCol]);
        const mae = parseFloat(benchmarkRow[benchmarkMaeCol]) || 0;
        totalWeightedMAE += mae * weight * num;
        totalWeight += num;
      }
    });

    return totalWeight > 0 ? (totalWeightedMAE / totalWeight) : null;
  };

  const findSkippedSubsets = (benchmark) => {
    let numSkipped = 0;

    const filteredRows = gmtkn55Subsets.filter(row => row[excludedCol].toLowerCase() !== "true");
    const filteredSubsets = filteredRows.map(row => row[subsetCol].toLowerCase());

    const benchmarkSubsetCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "subset");
    const benchmarkCompletedCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "completed");

    benchmark.forEach((benchmarkRow, i) => {
      if (i === 0) return; // ignore headers
      const currentSubset = benchmarkRow[benchmarkSubsetCol].toLowerCase();
      if (filteredSubsets.includes(currentSubset) && benchmarkRow[benchmarkCompletedCol].toLowerCase() === 'false') {
        numSkipped += 1;
      }
    });

    return numSkipped > 0 ? numSkipped : null;
  };

  const categories = [
    {
      display: "Small Systems",
      name: "Basic properties and reaction energies for small systems"
    },
    {
      display: "Large Systems",
      name: "Reaction energies for large systems and isomerisation reactions"
    },
    {
      display: "Barrier Heights",
      name: "Reaction barrier heights"
    },
    {
      display: "Intramolecular NCIs",
      name: "Intramolecular noncovalent interactions",
    },
    {
      display: "Intermolecular NCIs",
      name: "Intermolecular noncovalent interactions",
    },
    {
      display: "All",
      name: "All",
    }
  ];

  let subsets = [];
  gmtkn55Subsets.forEach((row, i) => {
    if (i !== 0 && row[excludedCol].toLowerCase() !== "true") {
      subsets.push({ subset: row[subsetCol], description: row[descriptionCol] })
    }
  });

  const data = useMemo(() => Object.keys(gmtkn55Benchmarks).map((nnp) => {
    const benchmark = gmtkn55Benchmarks[nnp].benchmark;

    let row = {
      name: nnp,
      skipped: findSkippedSubsets(benchmark),
      from: gmtkn55Benchmarks[nnp].from,
      reference: gmtkn55Benchmarks[nnp].reference || false,
    };
    categories.forEach(category => {
      row[category.name] = calculateWeightedMAE(benchmark, category.name);
    });

    const benchmarkSubsetCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "subset");
    const benchmarkMaeCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "mae");

    benchmark.forEach(benchmarkRow => {
      row[benchmarkRow[benchmarkSubsetCol]] = benchmarkRow[benchmarkMaeCol] ? Number(benchmarkRow[benchmarkMaeCol]) : null;
    });
    return row;
  }), []);

  const [viewSubsets, setViewSubsets] = useState(false);
  const [sortOn, setSortOn] = useState("All");

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (typeof a[sortOn] === "number" && typeof b[sortOn] === "number") {
        return a[sortOn] - b[sortOn];
      } else if (typeof a[sortOn] === "string" && typeof b[sortOn] === "string") {
        return a[sortOn].localeCompare(b[sortOn]);
      }
      return 0;
    });
  }, [data, sortOn]);

  return (
    <>
      <button onClick={() => setViewSubsets(!viewSubsets)}>
        {viewSubsets ? "View results by category" : "View results by subset"}
      </button>
      <table>
        <thead>
          <tr>
            <th style={{ "paddingRight": "2ch" }}>Name</th>
            {viewSubsets
              ? subsets.map((subset, i) =>
                <th style={{ "paddingRight": "2ch" }} key={i} title={subset.description}>
                  {subset.subset} <button onClick={() => setSortOn(subset.subset)}>↓</button>
                </th>
              )
              : <>
                {categories.map((category, i) =>
                  <th style={{ "paddingRight": "2ch" }} key={i}>
                    {category.display} <button onClick={() => setSortOn(category.name)}>↓</button>
                  </th>
                )}
                <th style={{ "paddingRight": "2ch" }}>Incomplete Subsets</th>
              </>
            }
            <th style={{ "paddingRight": "2ch" }}>Benchmarked By</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, i) => {
            return (
              <tr key={i} style={row.reference ? { "font-style": "italic", "opacity": 0.5 } : {}}>
                <td style={{ "paddingRight": "2ch" }}>{row.name}</td>
                {viewSubsets
                  ? subsets.map((subset, j) =>
                    <td style={{ "paddingRight": "2ch" }} key={`${i}${j}`}>
                      {row[subset.subset]?.toFixed(2)}
                    </td>
                  )
                  : <>
                    {categories.map((category, j) =>
                      <td style={{ "paddingRight": "2ch" }} key={`${i}${j}`}>{row[category.name]?.toFixed(2)}</td>
                    )}
                    <td style={{ "paddingRight": "2ch" }}>{row.skipped}</td>
                  </>
                }
                <td style={{ "paddingRight": "2ch" }}>{row.from.includes("http") ? <a href={row.from}>link</a> : row.from}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

const NNPs = () => {
  return (
    <table>
      <thead>
        <tr>
          {nnps[0].map((header, index) => (
            <th key={index} style={{ "paddingRight": "2ch" }}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {nnps.filter((_, i) => i > 0).map((row, i) => (
          <tr key={i}>
            {Object.values(row).map((value, j) => (
              <td key={j} style={{ "paddingRight": "2ch" }}>{value.includes("http") ? <a href={value}>link</a> : value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

ReactDOM.render(<GMTKN55 />, document.getElementById('gmtkn55'));
ReactDOM.render(<NNPs />, document.getElementById('nnps'));

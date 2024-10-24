import React from 'react';
import ReactDOM from 'react-dom';
import nnps from './data/nnps.csv';
import gmtkn55Subsets from './data/gmtkn55/subsets.csv';

import aimnet2 from './data/gmtkn55/aimnet2-old-gmtkn55.csv';
import macemp0 from './data/gmtkn55/mace-mp-0-gmtkn55.csv';
import orbnetdenali from './data/gmtkn55/orbnet-denali-gmtkn55.csv';
import ani2x from './data/gmtkn55/ani-2x-gmtkn55.csv';
import ani1ccx from './data/gmtkn55/ani-1ccx-gmtkn55.csv';

// standardize names with nnps.csv please!
// sorry this isn't more high tech
const gmtkn55Benchmarks = {
  "OrbNet Denali": {
    benchmark: orbnetdenali,
    from: "OrbNet Denali SI"
  },
  "AIMNet2 (ωB97M-D3, old)": {
    benchmark: aimnet2,
    from: "Ari 2024-10-23"
  },
  "ANI-1ccx": {
    benchmark: ani1ccx,
    from: "OrbNet Denali SI"
  },
  "ANI-2x": {
    benchmark: ani2x,
    from: "OrbNet Denali SI"
  },
  "MACE-MP-0": {
    benchmark: macemp0,
    from: "Ari 2024-10-23"
  },
};

const GMTKN55 = () => {
  const calculateWeightedMAE = (benchmark, category) => {
    let totalWeightedMAE = 0;
    let totalWeight = 0;

    const subsetCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "subset");
    const numCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "num");
    const weightCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "weight");
    const categoryCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "category");
    const excludedCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "excluded");
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

    return totalWeight > 0 ? (totalWeightedMAE / totalWeight).toFixed(2) : null;
  };

  const findSkippedSubsets = (benchmark) => {
    let numSkipped = 0;

    const subsetCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "subset");
    const excludedCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "excluded");
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

  return (
    <table>
      <thead>
        <tr>
          <th style={{ "paddingRight": "2ch" }}>Name</th>
          {categories.map(category =>
            <th style={{ "paddingRight": "2ch" }}>{category.display}</th>
          )}
          <th style={{ "paddingRight": "2ch" }}>Incomplete Subsets</th>
          <th style={{ "paddingRight": "2ch" }}>Benchmarked By</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(gmtkn55Benchmarks).map((nnp, i) => {
          return (
            <tr key={i}>
              <td style={{ "paddingRight": "2ch" }}>{nnp}</td>
              {categories.map(category =>
                <td style={{ "paddingRight": "2ch" }}>{calculateWeightedMAE(gmtkn55Benchmarks[nnp].benchmark, category.name)}</td>
              )}
              <td style={{ "paddingRight": "2ch" }}>{findSkippedSubsets(gmtkn55Benchmarks[nnp].benchmark)}</td>
              <td style={{ "paddingRight": "2ch" }}>{gmtkn55Benchmarks[nnp].from}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
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

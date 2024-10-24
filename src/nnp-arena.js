import React from 'react';
import ReactDOM from 'react-dom';
import nnps from './data/nnps.csv';
import gmtkn55Subsets from './data/gmtkn55/subsets.csv';

import aimnet2 from './data/gmtkn55/aimnet2-old-gmtkn55.csv';
import macemp0 from './data/gmtkn55/mace-mp-0-gmtkn55.csv';

// standardize names with nnps.csv please!
// sorry this isn't more high tech
const gmtkn55Benchmarks = {
  "AIMNet2 (ωB97M-D3, old)": aimnet2,
  "MACE-MP-0": macemp0,
};

const GMTKN55 = () => {
  const calculateWeightedMAE = (benchmark, category) => {
    let totalWeightedMAE = 0;
    let totalWeight = 0;

    const subsetCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "subset");
    const numCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "num");
    const weightCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "weight");
    const categoryCol = gmtkn55Subsets[0].findIndex(entry => entry.toLowerCase() === "category");
    const categoryRows = gmtkn55Subsets.filter(row => category === "All" ? true : row[categoryCol] === category);
    const categorySubsets = categoryRows.map(row => row[subsetCol].toLowerCase());

    const benchmarkSubsetCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "subset");
    const benchmarkCompletedCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "completed");
    const benchmarkMaeCol = benchmark[0].findIndex(entry => entry.toLowerCase() === "mae");

    benchmark.forEach((benchmarkRow, i) => {
      if (i === 0) return; // ignore headers
      const currentSubset = benchmarkRow[benchmarkSubsetCol].toLowerCase();
      if (categorySubsets.includes(currentSubset) && benchmarkRow[benchmarkCompletedCol].toLowerCase() === 'true') {
        const weight = parseFloat(gmtkn55Subsets.find(row => row[subsetCol].toLowerCase() === currentSubset)[weightCol]);
        const num = parseFloat(gmtkn55Subsets.find(row => row[subsetCol].toLowerCase() === currentSubset)[numCol]);
        const mae = parseFloat(benchmarkRow[benchmarkMaeCol]) || 0;
        totalWeightedMAE += mae * weight * num;
        totalWeight += num;
      }
    });

    return (totalWeight > 0 ? totalWeightedMAE / totalWeight : 0).toFixed(2);
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
        </tr>
      </thead>
      <tbody>
        {Object.keys(gmtkn55Benchmarks).map((nnp, i) => {
          return (
            <tr key={i}>
              <td style={{ "paddingRight": "2ch" }}>{nnp}</td>
              {categories.map(category =>
                <td style={{ "paddingRight": "2ch" }}>{calculateWeightedMAE(gmtkn55Benchmarks[nnp], category.name)}</td>
              )}
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

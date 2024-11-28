import React from "react";
import nnps from "../data/nnps.csv";

const NNPs = () => {
  return (
    <table>
      <thead>
        <tr>
          {nnps[0].map((header, index) => (
            <th key={index} style={{ paddingRight: "2ch" }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {nnps
          .filter((_, i) => i > 0)
          .map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((value, j) => (
                <td key={j} style={{ paddingRight: "2ch" }}>
                  {value.includes("http") ? <a href={value}>link</a> : value}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default NNPs;

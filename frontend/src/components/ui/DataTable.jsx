function DataTable({ columns, data, emptyMessage = "No records found", rowKey }) {
  if (data.length === 0) {
    return <p className="empty-inline">{emptyMessage}</p>;
  }
  return <div className="table-wrap"><table className="table"><thead><tr>{columns.map((col) => <th key={col.key} style={col.width ? { width: col.width } : void 0}>{col.header}</th>)}</tr></thead><tbody>{data.map((row) => <tr key={rowKey(row)}>{columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? "\u2014")}</td>)}</tr>)}</tbody></table></div>;
}
export {
  DataTable
};

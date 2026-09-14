// jsPDF's package.json only maps types for the top-level "jspdf" export —
// importing its ES build by an explicit subpath (done in pdf-export.web.ts
// to route around a Metro bundling issue with the package's Node build)
// otherwise has no type information. Reuse the same shape here.
declare module 'jspdf/dist/jspdf.es.min.js' {
  export * from 'jspdf';
  import jsPDF from 'jspdf';
  export default jsPDF;
}

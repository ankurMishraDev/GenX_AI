// generate-docx.js
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const projectRoot = process.argv[2] || "./";

function getAllSourceFiles(dir) {
  const patterns = [
    "**/*.{js,jsx,ts,tsx}",
    "**/*.py",
    "**/*.json",
  ];

  let files = [];
  patterns.forEach((pattern) => {
    const matched = glob.sync(pattern, {
      cwd: dir,
      ignore: ["node_modules/**", ".git/**", "dist/**", "__pycache__/**","package-lock.json","yarn.lock","pnpm-lock.yaml","vapi.ts",".next/**"],
    });
    files = [...files, ...matched];
  });

  return [...new Set(files)];
}

async function generateDocx() {
  const files = getAllSourceFiles(projectRoot);
  const children = [
    new Paragraph({
      text: "Complete Source Code",
      heading: HeadingLevel.HEADING_1,
    }),
  ];

  files.forEach((file) => {
    const filePath = path.join(projectRoot, file);
    const content = fs.readFileSync(filePath, "utf-8");

    children.push(
      new Paragraph({
        text: file,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    content.split("\n").forEach((line) => {
      children.push(
        new Paragraph({
          text: line || " ",
          run: { fontFamily: "Courier New", size: 18 },
        })
      );
    });

    children.push(new Paragraph({ text: "", pageBreakBefore: true }));
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);

  fs.writeFileSync("source-code.docx", buffer);
  console.log(`✅ Generated source-code.docx with ${files.length} files`);
}

generateDocx().catch(console.error);

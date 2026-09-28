const fs = require('fs');
const path = require('path');

function replaceBrand() {
  const dirsToSkip = ['.git', 'node_modules', 'dist', '.output', '.vite'];
  const extToProcess = ['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md'];
  let modifiedFiles = [];
  let renamedFiles = [];

  function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      let isDirectory = fs.statSync(dirPath).isDirectory();
      if (isDirectory) {
        if (!dirsToSkip.includes(f)) {
          walkDir(dirPath);
        }
      } else {
        const ext = path.extname(f);
        if (extToProcess.includes(ext)) {
          let content = fs.readFileSync(dirPath, 'utf-8');
          let newContent = content
            .replace(/SAVRANO/g, 'MARG')
            .replace(/Savrano/g, 'Marg')
            .replace(/savrano/g, 'marg');
            
          if (content !== newContent) {
            fs.writeFileSync(dirPath, newContent, 'utf-8');
            modifiedFiles.push(dirPath);
          }
        }
      }
    });
  }
  
  walkDir('.');
  
  function renameFiles(dir) {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      let isDirectory = fs.statSync(dirPath).isDirectory();
      
      let lowerF = f.toLowerCase();
      if (lowerF.includes('savrano')) {
        let newName = f.replace(/savrano/g, 'marg').replace(/Savrano/g, 'Marg').replace(/SAVRANO/g, 'MARG');
        let newPath = path.join(dir, newName);
        fs.renameSync(dirPath, newPath);
        renamedFiles.push({from: dirPath, to: newPath});
        dirPath = newPath;
      }
      
      if (isDirectory && !dirsToSkip.includes(f)) {
        renameFiles(dirPath);
      }
    });
  }
  renameFiles('.');
  
  console.log("MODIFIED_FILES:", JSON.stringify(modifiedFiles, null, 2));
  console.log("RENAMED_FILES:", JSON.stringify(renamedFiles, null, 2));
}
replaceBrand();

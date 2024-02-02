// service.mjs

import fs from 'fs';
import path from 'path';

const fileDisplay = (filePath, allowTypes = [], callback) => {
  const rootPath = path.resolve('./'); // 获取当前工作目录的绝对路径

  const display = filePath => {
    // 根据文件路径读取文件，返回文件列表
    return fs.promises.readdir(filePath)
      .then(files => {
        const promises = files.map(filename => {
          // 获取当前文件的绝对路径
          const filedir = path.join(filePath, filename);
          return fs.promises.stat(filedir)
            .then(stats => {
              // 是否是文件
              const isFile = stats.isFile();
              // 是否是文件夹
              const isDir = stats.isDirectory();
              if (isFile) {
                // 将绝对路径转换为相对于当前工作目录的相对路径
                const relativePath = path.relative(rootPath, filedir).replace(/\\/img, '/');
                const extname = path.extname(relativePath).toLowerCase();
                const basename = path.basename(relativePath).toLowerCase();
                // 检查文件类型是否在白名单中
                if (allowTypes.includes(extname) && !basename.endsWith('.spec.ts')) {
                  const file = {
                    type: extname.replace(/^\./, ''),
                    relativePath,
                  };
                  callback(file);
                }
              }
              // 如果是文件夹，递归调用display函数
              if (isDir) {
                return display(filedir);
              }
            });
        });
        return Promise.all(promises);
      });
  };

  return display(filePath);
};

export { fileDisplay };

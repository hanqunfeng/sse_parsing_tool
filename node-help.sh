#!/usr/bin/env bash

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"

usage() {
  cat <<EOF
Node 命令使用说明脚本

用法:
  ./$SCRIPT_NAME                显示全部说明
  ./$SCRIPT_NAME all            显示全部说明
  ./$SCRIPT_NAME basic          仅显示 Node 基础命令
  ./$SCRIPT_NAME npm            仅显示 NPM 常用命令
  ./$SCRIPT_NAME npx            仅显示 NPX 常用命令
  ./$SCRIPT_NAME nrm            仅显示 NRM 源管理命令
  ./$SCRIPT_NAME project        仅显示项目初始化/运行命令
  ./$SCRIPT_NAME debug          仅显示调试与排错命令
  ./$SCRIPT_NAME env            仅显示环境与版本管理命令
  ./$SCRIPT_NAME quick          显示速查清单
  ./$SCRIPT_NAME --help         显示帮助

示例:
  ./$SCRIPT_NAME quick
  ./$SCRIPT_NAME npm
EOF
}

print_header() {
  printf "\n%s\n" "============================================================"
  printf "%s\n" "$1"
  printf "%s\n" "============================================================"
}

section_basic() {
  print_header "Node 基础命令"
  cat <<'EOF'
1) 查看版本
   node -v

2) 进入 REPL 交互环境
   node

3) 执行单行 JS
   node -e "console.log('hello node')"

4) 执行脚本文件
   node app.js

5) 查看帮助
   node --help

6) 查看详细版本信息（含 V8/OpenSSL 等）
   node -p "process.versions"
EOF
}

section_npm() {
  print_header "NPM 常用命令"
  cat <<'EOF'
1) 查看 npm 版本
   npm -v

2) 初始化项目
   npm init -y

3) 安装依赖（生产）
   npm install <pkg>
   npm i <pkg>

4) 安装开发依赖
   npm i -D <pkg>

5) 全局安装
   npm i -g <pkg>

6) 卸载依赖
   npm uninstall <pkg>

7) 更新依赖
   npm update

8) 安装 package-lock 锁定版本依赖
   npm ci
   (适合 CI/服务器，要求 lock 文件存在)

9) 查看脚本
   npm run

10) 执行脚本
    npm run dev
    npm run build
    npm run test

11) 查看某包信息
    npm info <pkg>
EOF
}

section_npx() {
  print_header "NPX 常用命令"
  cat <<'EOF'
1) 临时执行包命令（无需全局安装）
   npx <command>

2) 创建项目示例
   npx create-vite@latest my-app

3) 指定版本执行
   npx eslint@8 --version

4) 说明
   npx 会优先使用当前项目 node_modules/.bin 中的命令
EOF
}

section_nrm() {
  print_header "NRM (npm registry manager) 常用命令"
  cat <<'EOF'
1) 查看当前可用源列表
   nrm ls

2) 切换到官方源
   nrm use npm

3) 切换到淘宝镜像源
   nrm use taobao

4) 测试各个源速度
   nrm test

5) 添加自定义源
   nrm add <name> <registry_url>
   示例:
   nrm add myregistry https://registry.example.com/

6) 删除自定义源
   nrm del <name>

7) 查看当前 npm 实际使用的 registry
   npm config get registry

说明:
- nrm 只负责切换 npm registry，本质是修改 npm 的 registry 配置。
- 切换后对 npm/pnpm/yarn 是否生效取决于各自配置，建议用对应工具再确认一遍。
EOF
}

section_project() {
  print_header "项目初始化与运行（常见流程）"
  cat <<'EOF'
1) 新建项目目录
   mkdir my-node-app && cd my-node-app

2) 初始化 package.json
   npm init -y

3) 安装依赖（示例）
   npm i express

4) 安装开发工具（示例）
   npm i -D nodemon typescript ts-node @types/node

5) package.json 常见 scripts（示例）
   "scripts": {
     "dev": "nodemon src/index.js",
     "start": "node src/index.js",
     "build": "tsc"
   }

6) 启动项目
   npm run dev
   npm start
EOF
}

section_debug() {
  print_header "调试与排错命令"
  cat <<'EOF'
1) 启用 Node 调试端口
   node --inspect app.js

2) 程序启动即断点
   node --inspect-brk app.js

3) 打印环境变量
   node -e "console.log(process.env)"

4) 查看当前 npm 配置
   npm config list

5) 清理 npm 缓存（排错常用）
   npm cache clean --force

6) 查看依赖树
   npm ls
EOF
}

section_env() {
  print_header "环境与版本管理"
  cat <<'EOF'
1) 查看 Node 可执行文件路径
   which node

2) 查看 npm 全局安装路径
   npm root -g

3) 使用 nvm 列出可安装版本（若已安装 nvm）
   nvm ls-remote

4) 使用 nvm 安装/切换版本（若已安装 nvm）
   nvm install 20
   nvm use 20

5) 查看当前项目 engines（如果 package.json 配置了）
   node -e "const p=require('./package.json');console.log(p.engines||'未配置 engines')"
EOF
}

section_quick() {
  print_header "Node 速查清单"
  cat <<'EOF'
node -v                      # 查看 node 版本
npm -v                       # 查看 npm 版本
npm install                  # 安装依赖
npm run dev                  # 启动开发脚本
npm run build                # 构建项目
npm test                     # 运行测试（若已配置）
node --inspect app.js        # 调试运行
npx <command>                # 临时执行命令
nrm ls                       # 查看并管理 npm 镜像源
EOF
}

main() {
  local mode="${1:-all}"
  case "$mode" in
    all)
      section_basic
      section_npm
      section_npx
      section_nrm
      section_project
      section_debug
      section_env
      section_quick
      ;;
    basic) section_basic ;;
    npm) section_npm ;;
    npx) section_npx ;;
    nrm) section_nrm ;;
    project) section_project ;;
    debug) section_debug ;;
    env) section_env ;;
    quick) section_quick ;;
    -h|--help|help) usage ;;
    *)
      echo "未知参数: $mode"
      echo
      usage
      exit 1
      ;;
  esac
}

main "${1:-all}"

const fs = require('node:fs');
const path = require('node:path');
const { root, session, selectDevice, invoke, save } = require('./argentRuntime.cjs');
const { compact, failed } = require('./argentReport.cjs');

const deviceTools = new Set(['describe', 'await-ui-element', 'gesture-tap', 'keyboard', 'restart-app', 'open-url']);
const recordingTools = new Set(['flow-start-recording', 'flow-add-step', 'flow-add-echo', 'flow-finish-recording']);
const localName = value => /^local-[a-z0-9_-]+$/.test(value || '');

function deviceArgs(context, tool, args) {
  if (!deviceTools.has(tool)) throw new Error(`Bu kısa yolun desteklemediği araç: ${tool}`);
  if (args.bundleId && args.bundleId !== context.bundleId) throw new Error('Yalnızca bluma Yerel desteklenir.');
  if (tool === 'open-url' && !args.url?.startsWith('bluma-local://')) throw new Error('Yerel uygulama bağlantısı gerekir.');
  return {
    ...args, udid: context.device,
    ...(['describe', 'restart-app'].includes(tool) ? { bundleId: context.bundleId } : {}),
  };
}

function execute(context, tool, args) {
  if (!recordingTools.has(tool)) return invoke(context, tool, deviceArgs(context, tool, args));
  if (!localName(args.name)) throw new Error('Kayıt adı local- ile başlamalı; alt çizgi, harf ve rakam içerebilir.');
  if (tool === 'flow-start-recording' && fs.existsSync(path.join(root, '.argent/flows', `${args.name}.yaml`))) {
    throw new Error('Mevcut akışın üzerine kayıt yapılmaz; yeni bir kayıt adı seç.');
  }
  if (tool === 'flow-add-step') {
    const nested = typeof args.args === 'string' ? JSON.parse(args.args) : args.args || {};
    args.args = JSON.stringify(deviceArgs(context, args.command, nested));
  }
  return invoke(context, tool, { ...args, project_root: root });
}

function main() {
  const [command, target, argument] = process.argv.slice(2);
  if (command === 'use') {
    const context = selectDevice(target);
    console.log(JSON.stringify({ device: context.device, app: context.bundleId }));
    return;
  }
  if (!['inspect', 'run', 'exec'].includes(command)) {
    throw new Error('Kullanım: qa:ui use <UDID> | inspect [regex] | run <local-akış> | exec <araç> [JSON]');
  }
  const context = session();
  const started = Date.now();
  const result = command === 'inspect'
    ? execute(context, 'describe', {})
    : command === 'exec'
      ? execute(context, target, argument ? JSON.parse(argument) : {})
      : runFlow(context, target);
  const directory = save(command === 'run' ? target : target || command, result);
  if (command === 'inspect') {
    const pattern = target ? new RegExp(target, 'i') : /AX(Button|TextField|SecureTextField)|AXStaticText/;
    const lines = (result.description || '').split('\n').filter(line => pattern.test(line));
    console.log(JSON.stringify({ matches: lines.length, elements: lines.slice(0, 16), report: directory }));
  } else {
    console.log(JSON.stringify({ ...compact(result), durationMs: Date.now() - started, report: directory }));
  }
  if (failed(result) || (command === 'run' && result.ok !== true)) {
    try {
      invoke(context, 'screenshot', { udid: context.device, out: path.join(directory, 'failure.png') });
    } catch { /* Asıl hata result.json içinde korunur. */ }
    process.exitCode = 1;
  }
}

function runFlow(context, name) {
  if (!localName(name)) throw new Error('Yalnızca local- adlı yerel test akışları çalıştırılır.');
  const file = path.join(root, '.argent/flows', `${name}.yaml`);
  const source = fs.readFileSync(file, 'utf8');
  if (/com\.asamethon\.bluma(?!\.local)\b/.test(source)) throw new Error('Canlı uygulamayı hedefleyen akış reddedildi.');
  // Fragmentin ön koşulunu sessizce onaylama; launch ile başlayan akışları kullan.
  if (/^executionPrerequisite:/m.test(source)) throw new Error('Bu komut launch ile başlayan akış gerektirir.');
  return invoke(context, 'flow-execute', { name, project_root: root, device: context.device, platform: 'ios' });
}

try { main(); } catch (error) {
  console.error(JSON.stringify({ verdict: 'ERROR', message: error.message.slice(0, 800) }));
  process.exitCode = 1;
}

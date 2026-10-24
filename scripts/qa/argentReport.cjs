function collectFindings(value, prefix = '', findings = []) {
  if (!value || typeof value !== 'object') return findings;
  for (const [key, item] of Object.entries(value)) {
    if ((key === 'warnings' || key === 'summary') && Array.isArray(item)) {
      findings.push(...item.filter(line => typeof line === 'string' && (key === 'warnings' || /^\s*warning:/.test(line))));
    } else if ((key === 'warning' || key === 'error') && item) {
      findings.push(`${prefix}${key}: ${typeof item === 'string' ? item : JSON.stringify(item)}`);
    } else if (item && typeof item === 'object') {
      collectFindings(item, `${prefix}${key}.`, findings);
    }
  }
  return findings;
}

function failed(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.ok === false || value.success === false || value.isError === true) return true;
  if (['fail', 'failed', 'errored', 'error'].includes(value.status)) return true;
  if (value.failed > 0 || value.errored > 0) return true;
  if (value.error) return true;
  return Object.values(value).some(item => typeof item === 'object' && failed(item));
}

function compact(result) {
  const findings = collectFindings(result);
  if (/brittle|\bwait.*did not pass\b/i.test(result.message || '')) findings.push(result.message);
  const steps = Array.isArray(result.steps) ? result.steps : [];
  const problems = steps.filter(step => step.status !== 'pass');
  return {
    verdict: failed(result) ? 'FAIL' : findings.length ? 'WARN' : 'OK',
    ...(typeof result.ok === 'boolean' ? { ok: result.ok } : {}),
    ...Object.fromEntries(['passed', 'failed', 'errored', 'skipped'].filter(key => typeof result[key] === 'number').map(key => [key, result[key]])),
    ...(result.message ? { message: result.message.slice(0, 240) } : {}),
    ...(result.recorded ? { recorded: result.recorded } : {}),
    ...(result.stepCount !== undefined ? { stepCount: result.stepCount } : {}),
    ...(typeof result.steps === 'number' ? { stepCount: result.steps } : {}),
    ...(problems.length ? { problems: problems.slice(0, 4).map(step => ({
      step: step.index + 1, status: step.status, target: step.target,
    })) } : {}),
    ...(findings.length ? { findings: findings.slice(0, 4).map(line => line.slice(0, 420)) } : {}),
  };
}

module.exports = { compact, failed };

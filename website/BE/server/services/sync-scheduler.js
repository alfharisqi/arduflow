import { config } from '../config.js';
import { runSqliteToMysqlSync } from './sqlite-to-mysql-sync.js';

let timer;
let running = false;

function logScheduler(message, meta = {}) {
  const safeMeta = { ...meta };
  delete safeMeta.token;
  delete safeMeta.secret;
  console.log(`[sync-scheduler] ${message}`, safeMeta);
}

export function startSyncScheduler() {
  if (!config.sync.enabled || !config.sync.schedulerEnabled) {
    logScheduler('disabled');
    return null;
  }

  if (timer) {
    return timer;
  }

  async function tick() {
    if (running) {
      logScheduler('previous sync still running, skipped');
      return;
    }

    running = true;
    try {
      const result = await runSqliteToMysqlSync();
      logScheduler('sync finished', {
        total: result.total,
        success: result.success,
        failed: result.failed,
        skipped: result.skipped,
        error: result.error,
      });
    } catch (error) {
      logScheduler('sync failed', {
        error: String(error?.message || error).slice(0, 500),
      });
    } finally {
      running = false;
    }
  }

  const scheduleTick = () => {
    timer = setInterval(tick, config.sync.intervalMs);
    timer.unref?.();
  };

  if (config.sync.initialDelayMs > 0) {
    const initialTimer = setTimeout(tick, config.sync.initialDelayMs);
    initialTimer.unref?.();
  } else {
    void tick();
  }
  scheduleTick();

  logScheduler('started', {
    intervalMs: config.sync.intervalMs,
    initialDelayMs: config.sync.initialDelayMs,
  });

  return timer;
}

export function stopSyncScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

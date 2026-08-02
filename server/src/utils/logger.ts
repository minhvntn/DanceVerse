type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, namespace: string, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    let metaString = '';
    if (meta) {
      if (typeof meta === 'object') {
        try {
          metaString = ' ' + JSON.stringify(meta);
        } catch {
          metaString = ' [Circular or Unserializable Object]';
        }
      } else {
        metaString = ' ' + String(meta);
      }
    }
    return `[${timestamp}] [${level.toUpperCase()}] [${namespace}] ${message}${metaString}`;
  }

  public info(namespace: string, message: string, meta?: any) {
    console.log(this.formatMessage('info', namespace, message, meta));
  }

  public warn(namespace: string, message: string, meta?: any) {
    console.warn(this.formatMessage('warn', namespace, message, meta));
  }

  public error(namespace: string, message: string, meta?: any) {
    console.error(this.formatMessage('error', namespace, message, meta));
  }

  public debug(namespace: string, message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', namespace, message, meta));
    }
  }
}

export const logger = new Logger();

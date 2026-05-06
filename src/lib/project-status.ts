import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'project_status.json');

export type ProjectStatus = 'ACTIVE' | 'LOCKED' | 'TERMINATED';

export interface StatusConfig {
  status: ProjectStatus;
  message?: string;
  updatedAt: string;
}

export function getProjectStatus(): StatusConfig {
  try {
    if (!fs.existsSync(STATUS_FILE)) {
      const defaultConfig: StatusConfig = {
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(STATUS_FILE, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    const data = fs.readFileSync(STATUS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading project status:', error);
    return { status: 'ACTIVE', updatedAt: new Date().toISOString() };
  }
}

export function setProjectStatus(status: ProjectStatus, message?: string) {
  const config: StatusConfig = {
    status,
    message,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(config, null, 2));
  return config;
}

import { Types } from 'mongoose';
import { ActivityAction, ActivityLog } from '../models/ActivityLog';

interface LogActivityParams {
  task: Types.ObjectId | string;
  actor: Types.ObjectId | string;
  action: ActivityAction;
  meta?: { from?: unknown; to?: unknown };
}

export async function logActivity({ task, actor, action, meta }: LogActivityParams): Promise<void> {
  await ActivityLog.create({ task, actor, action, meta });
}

import { Schema, model, Document, Types } from 'mongoose';

export type ActivityAction =
  | 'created'
  | 'status_changed'
  | 'priority_changed'
  | 'assignee_changed'
  | 'due_date_changed';

export const ACTIVITY_ACTIONS: ActivityAction[] = [
  'created',
  'status_changed',
  'priority_changed',
  'assignee_changed',
  'due_date_changed',
];

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  task: Types.ObjectId;
  actor: Types.ObjectId;
  action: ActivityAction;
  meta?: { from?: unknown; to?: unknown };
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    meta: {
      from: { type: Schema.Types.Mixed },
      to: { type: Schema.Types.Mixed },
    },
  },
  { timestamps: true },
);

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);

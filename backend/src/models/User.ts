import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'invited';
export type CredentialTokenPurpose = 'invite' | 'reset';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
  credentialTokenHash?: string;
  credentialTokenExpires?: Date;
  credentialTokenPurpose?: CredentialTokenPurpose;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    status: { type: String, enum: ['active', 'invited'], default: 'active' },
    tokenVersion: { type: Number, default: 0, select: false },
    credentialTokenHash: { type: String, select: false },
    credentialTokenExpires: { type: Date, select: false },
    credentialTokenPurpose: { type: String, enum: ['invite', 'reset'], select: false },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.passwordHash;
    delete obj.tokenVersion;
    delete obj.credentialTokenHash;
    delete obj.credentialTokenExpires;
    delete obj.credentialTokenPurpose;
    delete obj.__v;
    return obj;
  },
});

export const User = model<IUser>('User', userSchema);

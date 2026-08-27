import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Comment } from '../models/Comment';

const SEED_USERS = [
  { name: 'Alex Morgan', email: 'alex@taskflow.io', password: 'password123', role: 'admin' as const },
  { name: 'Sarah Chen', email: 'sarah@taskflow.io', password: 'password123', role: 'member' as const },
];

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Task.deleteMany({}), Comment.deleteMany({})]);

  const users = await Promise.all(
    SEED_USERS.map(async (u) =>
      User.create({ name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 12) }),
    ),
  );

  const [alex, sarah] = users;

  const task = await Task.create({
    title: 'Implement user authentication',
    description: 'Implement authentication for the application including login, registration, session handling.',
    status: 'in_progress',
    priority: 'urgent',
    assignee: sarah._id,
    creator: alex._id,
  });

  await Comment.create({
    task: task._id,
    author: sarah._id,
    body: 'Login and registration are done behind a feature flag. Session refresh rotation is next.',
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded ${users.length} users and 1 task.`);
  // eslint-disable-next-line no-console
  console.log('Login with: alex@taskflow.io / password123  or  sarah@taskflow.io / password123');

  await disconnectDB();
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

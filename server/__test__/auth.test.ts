import request from 'supertest';
import db from '../database/db';
import { app, server } from '../app';
import User from '../models/userModel';
import { tokenSign } from '../utils/handleJwt';
import bcrypt from "bcrypt";

let adminToken: string, userToken: string;

beforeAll(async () => {
  await db.sync();

  const hashedPasswordAdmin = await bcrypt.hash('hashedPassword', 10);
  const hashedPasswordUser = await bcrypt.hash('hashedPassword', 10);


  const adminUser = await User.create({
    username: 'adminUser',
    email: 'admin@example.com',
    password: hashedPasswordAdmin,
    role: 'admin',
  });
  adminToken = await tokenSign(adminUser);

  const regularUser = await User.create({
    username: 'regularUser',
    email: 'user@example.com',
    password: hashedPasswordUser,
    role: 'user',
  });
  userToken = await tokenSign(regularUser);
});

afterAll(async () => {
  await db.sync({ force: true });
  await db.close();
  server.close();
});

describe('POST /api/users/login', () => {
    it('should return 200 and sessionData if user login is correct', async () => {
      const loginData = {
        email: 'admin@example.com',
        password: 'hashedPassword',
      };
  
      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);
  
      expect(response.status).toBe(200);
      expect(response.body.sessionData).toHaveProperty('token');
      expect(response.body.sessionData.user).toHaveProperty('id');
      expect(response.body.sessionData.user).toHaveProperty('email');
      expect(response.body.sessionData.user).toHaveProperty('name');
      expect(response.body.sessionData.user).toHaveProperty('role');
    });

  it('should return 401 if password is incorrect', async () => {
    const loginData = {
      email: 'admin@example.com',
      password: 'incorrectPassword',
    };
    
    const response = await request(app)
    .post('/api/users/login')
    .send(loginData);
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', '❌ PASSWORD_INVALID');
  });
  
  it('should return 404 if user does not exist', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };
  
    const response = await request(app)
      .post('/api/users/login')
      .send(loginData);
  
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', '❌ USER_NOT_EXISTS'); 
  });
});

describe('POST /api/users/signup', () => {
  it('should return 201 if user signup is correct', async () => {
    const signupData = {
      username: 'User',
      email: 'testuser@example.com',
      password: 'hashedPassword',
      confirmPassword: 'hashedPassword',
    };

    const response = await request(app)
      .post('/api/users/signup')
      .send(signupData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('✅ User created successfully');
    expect(response.body).toHaveProperty('token');
  });

  it('should return 400 if passwords do not match', async () => {
    const signupData = {
      username: 'User',
      email: 'testuser@example.com',
      password: 'password1',
      confirmPassword: 'password2',
    };

    const response = await request(app)
      .post('/api/users/signup')
      .send(signupData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Las contraseñas no coinciden");
  });

  it('should return 409 if email is already in use', async () => {
    const signupData = {
      username: 'User1',
      email: 'testuser@example.com',
      password: 'hashedPassword',
      confirmPassword: 'hashedPassword',
    };

    const response = await request(app)
      .post('/api/users/signup')
      .send(signupData);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already in use");
  });

  it('should return 403 if non-admin user tries to assign admin role', async () => {
    const signupData = {
      username: 'User2',
      email: 'user2@example.com',
      password: 'hashedPassword',
      confirmPassword: 'hashedPassword',
      role: 'admin',
    };

    const response = await request(app)
      .post('/api/users/signup')
      .set('Authorization', 'Bearer nonAdminToken') 
      .send(signupData);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Access denied. Only admins can create other admins.");
  });
});
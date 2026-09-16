// eslint-disable-next-line no-restricted-syntax

/**
 * 1. main関数のテスト
 *   1.1 正常系
 *     1.1.1 signinアクションが正しく処理されること
 *     1.1.2 verifyアクションが正しく処理されること
 *   1.2 異常系
 *     1.2.1 リクエストボディが欠落している場合のエラーハンドリング
 *     1.2.2 actionパラメータが欠落している場合のエラーハンドリング
 *     1.2.3 signinアクションでusernameパラメータが欠落している場合のエラーハンドリング
 *     1.2.4 signinアクションでpasswordパラメータが欠落している場合のエラーハンドリング
 *     1.2.5 verifyアクションでtokenパラメータが欠落している場合のエラーハンドリング
 *     1.2.6 無効なactionパラメータが指定された場合のエラーハンドリング
 *     1.2.7 signinアクションでusernameに不正な型の値が指定された場合のエラーハンドリング
 *     1.2.8 signinアクションでpasswordに不正な型の値が指定された場合のエラーハンドリング
 *   1.3 内部エラー
 *     1.3.1 内部エラーが発生した場���のエラーハンドリング
 *
 * 2. signin関数のテスト
 *   2.1 正常系
 *     2.1.1 正しいユーザー名とパスワードが提供された場合、トークンが生成されること
 *   2.2 異常系
 *     2.2.1 存在しないユーザー名が提供された場合のエラーハンドリング
 *     2.2.2 無効なパスワードが提供された場合のエラーハンドリング
 *
 * 3. verifyToken関数のテスト
 *   3.1 正常系
 *     3.1.1 有効なトークンとシークレットが提供された場合、authenticatedがtrueになること
 *   3.2 異常系
 *     3.2.1 無効な形式のトークンが提供された場合のエラーハンドリング
 *     3.2.2 無効な署名のトークンが提供された場合のエラーハンドリング
 *     3.2.3 期限切れのトークンが提供された場合のエラーハンドリング
 *
 * 4. generateToken関数のテスト
 *   4.1 正常系
 *     4.1.1 有効なペイロード、シークレット、有効期限が提供された場合、トークンが生成されること
 *
 * 5. hashPassword関数のテスト
 *   5.1 正常系
 *     5.1.1 パスワードが提供された場合、ハッシュ値が生成されること
 *     5.1.2 同じパスワードに対して同じハッシュ値が生成されること
 *     5.1.3 異なるパスワードに対して異なるハッシュ値が生成されること
 *
 * 確認観点：
 * - 各関数が期待通りの動作をするか
 * - エラーケースが適切に処理されるか
 * - セキュリティ上の問題がないか（トークンの生成と検証、パスワードのハッシュ化）
 * - エッジケース（境界値）が適切に処理されるか
 * - 内部エラーが適切に処理されるか
 */

import { jest, describe, beforeEach, it, xit, expect } from '@jest/globals';
import main, { __forTest } from '.';

const { hashPassword, generateToken, verifyToken, signin, constants } = __forTest;
const { JWT_SECRET_NAME } = constants;

const kvsMock = {
  get: jest.fn(),
};
const loggerMock = {
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const craftSecretsMock = {
  get: jest.fn().mockResolvedValue({ [JWT_SECRET_NAME]: JWT_SECRET_NAME }),
};

const setupMocks = () => {
  jest.clearAllMocks();
};

const setupKvsMock = (username, password, role) => {
  const key = `hash-<% SOLUTION_ID %>-${username}`;
  kvsMock.get.mockResolvedValueOnce({
    [key]: { value: { password: hashPassword(password), role } },
  });
};

describe('Authentication Module', () => {
  beforeEach(setupMocks);

  // 1. main関数のテスト
  describe('1. main function', () => {
    // 1.1 正常系
    describe('1.1 when a valid request is provided', () => {
      // 1.1.1 signinアクションが正しく処理されること
      // TODO: モックをKVSモジュールに差し替えてテストする
      xit('1.1.1 should process signin action correctly', async () => {
        setupKvsMock('testuser', 'password', 'user');
        const req = {
          method: 'POST',
          body: {
            action: 'signin',
            username: 'testuser',
            password: 'password',
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ token: expect.any(String) })
        );
      });

      // 1.1.2 verifyアクションが正しく処理されること
      it('1.1.2 should process verify action correctly', async () => {
        const token = generateToken({
          payload: { username: 'testuser', role: 'user' },
          secret: JWT_SECRET_NAME,
          expiresIn: 3600,
        });
        const req = {
          method: 'POST',
          body: {
            action: 'verify',
          },
          headers: {
            authorization: `Bearer ${token}`,
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ authenticated: true });
      });
    });

    // 1.2 異常系
    describe('1.2 when an invalid request is provided', () => {
      // 1.2.1 リクエストボディが欠落している場合のエラーハンドリング
      it('1.2.1 should return an error if the request body is missing', async () => {
        const req = { method: 'POST' };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing action' });
      });

      // 1.2.2 actionパラメータが欠落している場合のエラーハンドリング
      it('1.2.2 should return an error if the action parameter is missing', async () => {
        const req = { method: 'POST', body: {} };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing action' });
      });

      // 1.2.3 signinアクションでusernameパラメータが欠落している場合のエラーハンドリング
      it('1.2.3 should return an error if the username parameter is missing for signin action', async () => {
        const req = {
          method: 'POST',
          body: {
            action: 'signin',
            password: 'password',
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Invalid 'username' or 'password' parameter",
        });
      });

      // 1.2.4 signinアクションでpasswordパラメータが欠落している場合のエラーハンドリング
      it('1.2.4 should return an error if the password parameter is missing for signin action', async () => {
        const req = {
          method: 'POST',
          body: {
            action: 'signin',
            username: 'testuser',
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Invalid 'username' or 'password' parameter",
        });
      });

      // 1.2.5 verifyアクションでtokenパラメータが欠落している場合のエラーハンドリング
      it('1.2.5 should return an error if the token parameter is missing for verify action', async () => {
        const req = {
          method: 'POST',
          body: {
            action: 'verify',
          },
          headers: {},
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Missing 'token' parameter" });
      });

      // 1.2.6 無効なactionパラメータが指定された場合のエラーハンドリング
      it('1.2.6 should return an error if an invalid action parameter is provided', async () => {
        const req = {
          method: 'POST',
          body: {
            action: 'invalidAction',
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Invalid 'action' parameter" });
      });

      // 1.2.7 signinアクションでusernameに不正な型の値が指定された場合のエラーハンドリング
      it('1.2.7 should return an error if the username parameter has an invalid type', async () => {
        const req = {
          method: 'POST',
          body: {
            action: 'signin',
            username: 123,
            password: 'password',
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Invalid 'username' or 'password' parameter",
        });
      });

      // 1.2.8 signinアクションでpasswordに不正な型の値が指定された場合のエラーハンドリング
      it('1.2.8 should return an error if the password parameter has an invalid type', async () => {
        const req = {
          method: 'POST',
          body: {
            action: 'signin',
            username: 'testuser',
            password: 123,
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: "Invalid 'username' or 'password' parameter",
        });
      });
    });

    // 1.3 内部エラー
    describe('1.3 when an internal error occurs', () => {
      // 1.3.1 内部エラーが発生した場合のエラーハンドリング
      it('1.3.1 should return a 500 status code and error message', async () => {
        kvsMock.get.mockRejectedValueOnce(new Error('Internal error'));
        const req = {
          method: 'POST',
          body: {
            action: 'signin',
            username: 'testuser',
            password: 'password',
          },
        };
        const res = {
          setHeader: jest.fn(),
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await main(
          { req, res },
          {
            MODULES: { initLogger: () => loggerMock, kvs: kvsMock, secret: craftSecretsMock },
          }
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
      });
    });
  });

  // 2. signin関数のテスト
  describe('2. signin function', () => {
    // 2.1 正常系
    describe('2.1 when correct username and password are provided', () => {
      // 2.1.1 正しいユーザー名とパスワードが提供された場合、トークンが生成されること
      // TODO: モックをKVSモジュールに差し替えてテストする
      xit('2.1.1 should generate a token', async () => {
        setupKvsMock('testuser', 'password', 'user');
        const result = await signin({
          username: 'testuser',
          password: 'password',
          kvs: kvsMock,
          logger: loggerMock,
          secret: JWT_SECRET_NAME,
        });
        expect(result.token).toBeDefined();
      });
    });

    // 2.2 異常系
    describe('2.2 when invalid username or password is provided', () => {
      // 2.2.1 存在しないユーザー名が提供された場合のエラーハンドリング
      it('2.2.1 should return an error if a non-existent username is provided', async () => {
        kvsMock.get.mockResolvedValueOnce({});
        const result = await signin({
          username: 'nonexistentuser',
          password: 'password',
          kvs: kvsMock,
          logger: loggerMock,
          secret: JWT_SECRET_NAME,
        });
        expect(result.error).toBe('Invalid username or password');
      });

      // 2.2.2 無効なパスワードが提供された場合のエラーハンドリング
      it('2.2.2 should return an error if an invalid password is provided', async () => {
        setupKvsMock('testuser', 'password', 'user');
        const result = await signin({
          username: 'testuser',
          password: 'invalidpassword',
          kvs: kvsMock,
          logger: loggerMock,
          secret: JWT_SECRET_NAME,
        });
        expect(result.error).toBe('Invalid username or password');
      });
    });
  });

  // 3. verifyToken関数のテスト
  describe('3. verifyToken function', () => {
    // 3.1 正常系
    describe('3.1 when a valid token and secret are provided', () => {
      // 3.1.1 有効なトークンとシークレットが提供された場合、authenticatedがtrueになること
      it('3.1.1 should return authenticated as true', () => {
        const token = generateToken({
          payload: { username: 'testuser', role: 'user' },
          secret: JWT_SECRET_NAME,
          expiresIn: 3600,
        });
        const result = verifyToken(token, JWT_SECRET_NAME);
        expect(result.authenticated).toBe(true);
      });
    });

    // 3.2 異常系
    describe('3.2 when an invalid token is provided', () => {
      // 3.2.1 無効な形式のトークンが提供された場合のエラーハンドリング
      it('3.2.1 should return authenticated as false and an error message when an invalid token format is provided', () => {
        const result = verifyToken('invalidtoken', JWT_SECRET_NAME);
        expect(result.authenticated).toBe(false);
        expect(result.error).toContain('Authentication error');
      });

      // 3.2.2 無効な署名のトークンが提供された場合のエラーハンドリング
      it('3.2.2 should return authenticated as false and an error message when a token with an invalid signature is provided', () => {
        const token = generateToken({
          payload: { username: 'testuser', role: 'user' },
          secret: 'invalidsecret',
          expiresIn: 3600,
        });
        const result = verifyToken(token, JWT_SECRET_NAME);
        expect(result.authenticated).toBe(false);
        expect(result.error).toContain('Authentication error');
      });

      // 3.2.3 期限切れのトークンが提供された場合のエラーハンドリング
      it('3.2.3 should return authenticated as false and an error message when an expired token is provided', () => {
        const token = generateToken({
          payload: { username: 'testuser', role: 'user' },
          secret: JWT_SECRET_NAME,
          expiresIn: -1,
        });
        const result = verifyToken(token, JWT_SECRET_NAME);
        expect(result.authenticated).toBe(false);
        expect(result.error).toContain('Authentication error');
      });
    });
  });

  // 4. generateToken関数のテスト
  describe('4. generateToken function', () => {
    // 4.1 正常系
    describe('4.1 normal case', () => {
      // 4.1.1 有効なペイロード、シークレット、有効期限が提供された場合、トークンが生成されること
      it('4.1.1 should generate a token when valid payload, secret, and expiresIn are provided', () => {
        const token = generateToken({
          payload: { username: 'testuser', role: 'user' },
          secret: JWT_SECRET_NAME,
          expiresIn: 3600,
        });
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });
    });
  });

  // 5. hashPassword関数のテスト
  describe('5. hashPassword function', () => {
    // 5.1 正常系
    describe('5.1 normal case', () => {
      // 5.1.1 パスワードが提供された場合、ハッシュ値が生成されること
      it('5.1.1 should generate a hash when a password is provided', () => {
        const hash = hashPassword('password');
        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
      });

      // 5.1.2 同じパスワードに対して同じハッシュ値が生成されること
      it('5.1.2 should generate the same hash for the same password', () => {
        const hash1 = hashPassword('password');
        const hash2 = hashPassword('password');
        expect(hash1).toBe(hash2);
      });

      // 5.1.3 異なるパスワードに対して異なるハッシュ値が生成されること
      it('5.1.3 should generate different hashes for different passwords', () => {
        const hash1 = hashPassword('password1');
        const hash2 = hashPassword('password2');
        expect(hash1).not.toBe(hash2);
      });
    });
  });
});

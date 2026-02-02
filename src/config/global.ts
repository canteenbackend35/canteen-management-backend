export const Global = {
  signupFormExpireTimeRedis: 600, //10 mins
  otpRateLimitExpireRedis: 60 * 60 * 24, //24 hours
  AcessTokenExpireTime: 15 * 60 * 1000, //15 mins
  RefreshTokenExpireTime: 7 * 24 * 60 * 60 * 1000, //7 days
  cookieOptions: (isProduction: boolean, maxAge: number) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge,
  }),
};

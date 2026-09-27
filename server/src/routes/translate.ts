import { Router } from "express";
import { z } from "zod";
import { asyncHandler, HttpError, parse } from "../http.js";
import { ChineseSourceError, translateToChinese } from "../translate.js";

export const translateRouter = Router();

translateRouter.post(
  "/translate/zh",
  asyncHandler(async (req, res) => {
    const { text } = parse(z.object({ text: z.string().trim().min(1).max(100) }), req.body);
    try {
      res.json({ text: await translateToChinese(text) });
    } catch (err) {
      if (err instanceof ChineseSourceError) throw new HttpError(400, err.message);
      console.error("Chinese translation failed:", err);
      throw new HttpError(503, "Translation service unavailable. Check the internet connection or type the Chinese name manually.");
    }
  }),
);

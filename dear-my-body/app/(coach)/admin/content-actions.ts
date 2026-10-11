"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCoach } from "@/lib/auth";
import { CONTENT_IMAGE_BUCKET } from "@/lib/content-image";
import { createClient } from "@/lib/supabase/server";
import {
  articleSchema,
  ingredientSchema,
  recipeSchema,
  type ArticleFormInput,
  type IngredientFormInput,
  type RecipeFormInput,
} from "@/lib/validations/content";
import type { ActionResult } from "@/types";

const FAILED = "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
const INVALID = "입력한 내용을 다시 확인해 주세요.";
const idSchema = z.uuid().nullable();

type ContentTable = "ingredients" | "recipes" | "articles";
type Supabase = Awaited<ReturnType<typeof createClient>>;

const LIST_PATH: Record<ContentTable, string> = {
  ingredients: "/admin/ingredients",
  recipes: "/admin/recipes",
  articles: "/admin/articles",
};
const LIBRARY_PATH: Record<ContentTable, string> = {
  ingredients: "/library/ingredients",
  recipes: "/library/recipes",
  articles: "/library/knowledge",
};

function revalidateContent(table: ContentTable) {
  revalidatePath(LIST_PATH[table], "layout");
  revalidatePath(LIBRARY_PATH[table], "layout");
}

/** 이미지를 바꾸거나 지웠으면 예전 파일을 정리한다 */
async function removeOldImage(supabase: Supabase, previous: string | null | undefined, next: string | null) {
  if (previous && previous !== next) {
    await supabase.storage.from(CONTENT_IMAGE_BUCKET).remove([previous]);
  }
}

async function previousImage(supabase: Supabase, table: "ingredients" | "recipes", id: string | null) {
  if (!id) return null;
  const { data } = await supabase.from(table).select("image_path").eq("id", id).maybeSingle();
  return data?.image_path ?? null;
}

// ---------------------------------------------------------------------------

export async function saveIngredient(id: string | null, input: IngredientFormInput): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = ingredientSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false, message: INVALID };
  await requireCoach();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    name: v.name,
    category: v.category,
    tags: v.tags,
    summary: v.summary,
    benefits: v.benefits,
    how_to_use: v.howToUse,
    caution: v.caution,
    image_path: v.imagePath,
    is_published: v.isPublished,
  };

  const previous = await previousImage(supabase, "ingredients", parsedId.data);
  const { error } = parsedId.data
    ? await supabase.from("ingredients").update(row).eq("id", parsedId.data)
    : await supabase.from("ingredients").insert(row);
  if (error) return { ok: false, message: FAILED };
  await removeOldImage(supabase, previous, v.imagePath);

  revalidateContent("ingredients");
  redirect(LIST_PATH.ingredients);
}

export async function saveRecipe(id: string | null, input: RecipeFormInput): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = recipeSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false, message: INVALID };
  await requireCoach();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    title: v.title,
    summary: v.summary,
    servings: v.servings,
    cook_minutes: v.cookMinutes,
    ingredients: v.ingredients,
    steps: v.steps.map((s, i) => ({ order: i + 1, text: s.text })),
    tags: v.tags,
    nutrition_note: v.nutritionNote,
    image_path: v.imagePath,
    is_published: v.isPublished,
  };

  const previous = await previousImage(supabase, "recipes", parsedId.data);
  let recipeId = parsedId.data;
  if (recipeId) {
    const { error } = await supabase.from("recipes").update(row).eq("id", recipeId);
    if (error) return { ok: false, message: FAILED };
  } else {
    const { data, error } = await supabase.from("recipes").insert(row).select("id").single();
    if (error || !data) return { ok: false, message: FAILED };
    recipeId = data.id;
  }

  // 연결된 식재료는 통째로 다시 맞춘다
  const { error: unlinkError } = await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
  if (unlinkError) return { ok: false, message: FAILED };
  if (v.ingredientIds.length) {
    const { error: linkError } = await supabase
      .from("recipe_ingredients")
      .insert([...new Set(v.ingredientIds)].map((ingredientId) => ({ recipe_id: recipeId, ingredient_id: ingredientId })));
    if (linkError) return { ok: false, message: FAILED };
  }
  await removeOldImage(supabase, previous, v.imagePath);

  revalidateContent("recipes");
  revalidateContent("ingredients");
  redirect(LIST_PATH.recipes);
}

export async function saveArticle(id: string | null, input: ArticleFormInput): Promise<ActionResult> {
  const parsedId = idSchema.safeParse(id);
  const parsed = articleSchema.safeParse(input);
  if (!parsedId.success || !parsed.success) return { ok: false, message: INVALID };
  await requireCoach();
  const supabase = await createClient();
  const v = parsed.data;
  const row = {
    title: v.title,
    category: v.category,
    body: v.body,
    sort_order: v.sortOrder,
    is_published: v.isPublished,
  };
  const { error } = parsedId.data
    ? await supabase.from("articles").update(row).eq("id", parsedId.data)
    : await supabase.from("articles").insert(row);
  if (error) return { ok: false, message: FAILED };

  revalidateContent("articles");
  redirect(LIST_PATH.articles);
}

// ---------------------------------------------------------------------------

const tableSchema = z.enum(["ingredients", "recipes", "articles"]);

export async function setPublished(table: ContentTable, id: string, isPublished: boolean): Promise<ActionResult> {
  const parsed = z.object({ table: tableSchema, id: z.uuid(), isPublished: z.boolean() }).safeParse({ table, id, isPublished });
  if (!parsed.success) return { ok: false, message: INVALID };
  await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from(parsed.data.table).update({ is_published: parsed.data.isPublished }).eq("id", parsed.data.id);
  if (error) return { ok: false, message: FAILED };
  revalidateContent(parsed.data.table);
  return { ok: true, data: undefined };
}

export async function deleteContent(table: ContentTable, id: string): Promise<ActionResult> {
  const parsed = z.object({ table: tableSchema, id: z.uuid() }).safeParse({ table, id });
  if (!parsed.success) return { ok: false, message: INVALID };
  await requireCoach();
  const supabase = await createClient();

  const image =
    parsed.data.table === "articles" ? null : await previousImage(supabase, parsed.data.table, parsed.data.id);
  const { error } = await supabase.from(parsed.data.table).delete().eq("id", parsed.data.id);
  if (error) return { ok: false, message: "지우지 못했어요. 잠시 후 다시 시도해 주세요." };
  await removeOldImage(supabase, image, null);

  revalidateContent(parsed.data.table);
  redirect(LIST_PATH[parsed.data.table]);
}

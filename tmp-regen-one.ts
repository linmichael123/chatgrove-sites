import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { config } from "./config.js";
import { slugify, assembleTemplate } from "./generate.js";

const prisma = new PrismaClient();

async function main() {
  const templateHtml = readFileSync(resolve(config.templatesDir, "unified.html"), "utf-8");
  const lead = await prisma.lead.findFirst({ where: { name: { contains: "Good Fellaz" } } });
  if (!lead || !lead.generatedContent) { console.log("Not found"); return; }

  const content = JSON.parse(lead.generatedContent);
  const slug = slugify(lead.name);
  const imagesDir = resolve(config.outputDir, slug, "images");

  const localPhotos: string[] = [];
  for (let i = 0; i < 3; i++) {
    if (existsSync(resolve(imagesDir, `photo-${i}.jpg`))) localPhotos.push(`images/photo-${i}.jpg`);
  }

  // Use the about page photo as additional gallery image
  const enhancedImages: { ogHero?: string; logo?: string } = {};
  if (existsSync(resolve(imagesDir, "og-hero.jpg"))) enhancedImages.ogHero = "images/og-hero.jpg";
  if (existsSync(resolve(imagesDir, "logo.png"))) enhancedImages.logo = "images/logo.png";

  // Add the about photo to the gallery
  if (existsSync(resolve(imagesDir, "about-photo.jpg"))) {
    localPhotos.unshift("images/about-photo.jpg");
  }

  const html = assembleTemplate(templateHtml, lead, content, localPhotos, enhancedImages);
  writeFileSync(resolve(config.outputDir, slug, "index.html"), html, "utf-8");
  console.log(`✅ Rebuilt: ${lead.name} with og-hero + logo + about photo in gallery`);
  console.log(`   Hero: ${enhancedImages.ogHero || "none"}`);
  console.log(`   Logo: ${enhancedImages.logo || "none"}`);
  console.log(`   Gallery photos: ${localPhotos.length}`);
  await prisma.$disconnect();
}
main().catch(console.error);

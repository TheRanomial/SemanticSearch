import { db } from "@/db";
import { Product, productsTable } from "@/db/schema";
import { sql } from "drizzle-orm";
import { X } from "lucide-react";
import Image from "next/image";
import { Index } from "@upstash/vector";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

export type CoreProduct = Omit<Product, "createdAt" | "updatedAt">;

const index = new Index<CoreProduct>();

const searchIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.query;

  if (!query) {
    redirect("/");
    return;
  }

  const queryString = Array.isArray(query) ? query[0] : query;

  let products: CoreProduct[] = await db
    .select()
    .from(productsTable)
    .where(
      sql`to_tsvector('simple', lower(${productsTable.name} || ' ' || ${
        productsTable.description
      })) @@ to_tsquery('simple', lower(${queryString
        .trim()
        .split(" ")
        .join(" & ")}))`
    )
    .limit(3);

  if (products.length < 3) {
    try {
      const response = await fetch(`http://localhost:3000/api/mistral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queryString }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const vector = await response.json();

      const res = await index.query({
        topK: 5,
        vector,
        includeMetadata: true,
      });

      const vectorProducts = res
        .filter((existingProduct) => {
          if (
            products.some((product) => product.id === existingProduct.id) ||
            existingProduct.score < 0.9
          ) {
            return false;
          } else {
            return true;
          }
        })
        .map(({ metadata }) => metadata!);

      products.push(...vectorProducts);
    } catch (error) {
      console.error("Error fetching from Mistral API:", error);
      redirect("/");
      return;
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-4 bg-white shadow-md rounded-b-md">
        <X className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No results</h3>
        <p className="mt-1 text-sm mx-auto max-w-prose text-gray-500">
          Sorry, we could not find any matches for{" "}
          <span className="text-green-600 font-medium">{query}</span>.
        </p>
      </div>
    );
  }

  return (
    <ul className="py-4 divide-y divide-zinc-100 bg-white shadow-md rounded-b-md">
      {products.slice(0, 3).map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <li className="mx-auto py-4 px-8 flex space-x-4">
            <div className="relative flex items-center bg-zinc-100 rounded-lg h-40 w-40">
              <Image
                loading="eager"
                fill
                alt="product-image"
                src={`/${product.imageId}`}
              />
            </div>

            <div className="w-full flex-1 space-y-2 py-1">
              <h1 className="text-lg font-medium text-gray-900">
                {product.name}
              </h1>

              <p className="prose prose-sm text-gray-500 line-clamp-3">
                {product.description}
              </p>

              <p className="text-base font-medium text-gray-900">
                ${product.price.toFixed(2)}
              </p>
            </div>
          </li>
        </Link>
      ))}
    </ul>
  );
}

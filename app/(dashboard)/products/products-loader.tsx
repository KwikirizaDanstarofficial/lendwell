"use client"
import dynamic from "next/dynamic"
export const ProductsClient = dynamic(
  () => import("./components/products-client").then((m) => ({ default: m.ProductsClient })),
  { ssr: false }
)

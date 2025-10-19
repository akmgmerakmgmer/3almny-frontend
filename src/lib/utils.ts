import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

// Minimal utility to merge Tailwind & conditional classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

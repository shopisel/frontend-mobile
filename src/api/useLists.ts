import { useApi } from "./useApi";
import { useCallback } from "react";

export interface ListItemResponse {
  id: number;
  productId: string;
  storeId: string;
  quantity: number;
  price: number;
  checked: boolean;
}

export interface ListResponse {
  id: string;
  name: string;
  createdAt: string;
  version: string;
  items: ListItemResponse[];
}

export interface ListItemRequest {
  productId: string;
  storeId: string;
  quantity: number;
  price: number;
  checked: boolean;
}

export function useLists() {
  const { get, post, put, del } = useApi();

  const getLists    = useCallback(async (): Promise<ListResponse[]>            => get("/lists"),                                               [get]);
  const getList     = useCallback(async (listId: string): Promise<ListResponse> => get(`/lists/${listId}`),                                    [get]);
  const createList  = useCallback(async (name: string): Promise<ListResponse>  => post("/lists", { name, items: [] }),                         [post]);
  const updateList  = useCallback(async (listId: string, version: string, name: string | undefined, items: ListItemRequest[]): Promise<ListResponse> => {
    const payload: Record<string, unknown> = { items };
    if (name !== undefined) payload.name = name;
    return put(`/lists/${listId}`, payload, { "If-Match": JSON.stringify(version) });
  }, [put]);
  const removeList  = useCallback(async (listId: string, version: string) => del(`/lists/${listId}`, { "If-Match": JSON.stringify(version) }), [del]);

  return { getLists, getList, createList, updateList, removeList };
}

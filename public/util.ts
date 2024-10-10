type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type Operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

/**
 * This list of operations is used to generate the manual testing UI.
 */
const operations: Operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update Password",
    endpoint: "/api/users/password",
    method: "PATCH",
    fields: { currentPassword: "input", newPassword: "input" },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input", communityId: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", content: "input", options: { backgroundColor: "input" } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Comments (empty for all)",
    endpoint: "/api/comments",
    method: "GET",
    fields: { target: "input" },
  },
  {
    name: "Create Comment",
    endpoint: "/api/comments",
    method: "POST",
    fields: { content: "input", target: "input" },
  },
  {
    name: "Update Comment",
    endpoint: "/api/comments/:id",
    method: "PATCH",
    fields: { id: "input", content: "input" },
  },
  {
    name: "Delete Comment",
    endpoint: "/api/comments/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Communities (empty for all)",
    endpoint: "/api/communities",
    method: "GET",
    fields: { name: "input" },
  },
  {
    name: "Create Community",
    endpoint: "/api/communities",
    method: "POST",
    fields: { name: "input", description: "input" },
  },
  {
    name: "Get Communities by User",
    endpoint: "/api/communities/user/:id",
    method: "GET",
    fields: { userId: "input" },
  },
  {
    name: "Search communities by keyword",
    endpoint: "/api/communities/search",
    method: "GET",
    fields: { keyword: "input" },
  },
  {
    name: "Join Community",
    endpoint: "/api/communities/join/:id",
    method: "PUT",
    fields: { id: "input" },
  },
  {
    name: "Leave Community",
    endpoint: "/api/communities/leave/:id",
    method: "PUT",
    fields: { id: "input" },
  },
  {
    name: "Create Collection",
    endpoint: "/api/collections",
    method: "POST",
    fields: { name: "input" },
  },
  {
    name: "Get Collections (empty for all)",
    endpoint: "/api/collections",
    method: "GET",
    fields: { owner: "input" },
  },
  {
    name: "Get Collection by Post and User",
    endpoint: "/api/collections/user/:id/post/:postId",
    method: "GET",
    fields: { owner: "input", postId: "input" },
  },
  {
    name: "Add Post to Collection",
    endpoint: "/api/collections/addPost/:id",
    method: "PATCH",
    fields: { id: "input", postId: "input" },
  },
  {
    name: "Remove Post from Collection",
    endpoint: "/api/collections/removePost/:id",
    method: "PATCH",
    fields: { id: "input", postId: "input" },
  },
  {
    name: "Delete Collection",
    endpoint: "/api/collections/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Incomplete Community Goals (empty for all)",
    endpoint: "/api/goals/incomplete/community",
    method: "GET",
    fields: { community: "input" },
  },
  { name: "Get Complete Community Goals (empty for all)", 
    endpoint: "/api/goals/complete/community", 
    method: "GET", 
    fields: { community: "input" } 
  },
  {
    name: "Get Incomplete User Goals (empty for all)",
    endpoint: "/api/goals/incomplete/user",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Get Complete User Goals (empty for all)",
    endpoint: "/api/goals/complete/user",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Community Goal",
    endpoint: "/api/goals/community",
    method: "POST",
    fields: { community: "input", name: "input", unit: "input", amount: "input", deadline: "input" },
  },
  {
    name: "Create User Goal",
    endpoint: "/api/goals/user",
    method: "POST",
    fields: { name: "input", unit: "input", amount: "input", deadline: "input" },
  },
  {
    name: "Update Community Goal",
    endpoint: "/api/goals/community/:id",
    method: "PATCH",
    fields: { id: "input", name: "input", unit: "input", amount: "input", deadline: "input" },
  },
  {
    name: "Update User Goal",
    endpoint: "/api/goals/user/:id",
    method: "PATCH",
    fields: { id: "input", name: "input", unit: "input", amount: "input", deadline: "input" },
  },
  {
    name: "Delete Community Goal",
    endpoint: "/api/goals/community/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Delete User Goal",
    endpoint: "/api/goals/user/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Add Community Goal Progress",
    endpoint: "/api/goals/community/:id/progress",
    method: "PATCH",
    fields: { id: "input", progress: "input" },
  },
  {
    name: "Add User Goal Progress",
    endpoint: "/api/goals/user/:id/progress",
    method: "PATCH",
    fields: { id: "input", progress: "input" },
  },
];

/*
 * You should not need to edit below.
 * Please ask if you have questions about what this test code is doing!
 */

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});

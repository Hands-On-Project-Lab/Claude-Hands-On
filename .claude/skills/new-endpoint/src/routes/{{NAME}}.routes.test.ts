import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { {{ NAME }}Repository } from "../repositories/{{NAME}}.repository";

const BASE = "/api/{{NAME}}";
const validPayload = {{ VALID_PAYLOAD }};
const missingId = "00000000-0000-4000-8000-000000000000";

describe("/api/{{NAME}}", () => {
    beforeEach(() => {
        { { NAME } } Repository.reset();
    });

    // @method:list
    describe("GET /", () => {
        it("returns 200 and an empty list initially", async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("returns 200 and existing items", async () => {
            await {{ NAME }
        }Repository.create(validPayload);
        const res = await request(app).get(BASE);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});
// @end

// @method:get
describe("GET /:id", () => {
    it("returns 200 for an existing item", async () => {
        const created = await {{ NAME }
    }Repository.create(validPayload);
    const res = await request(app).get(`${BASE}/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
});

it("returns 404 when the item does not exist", async () => {
    const res = await request(app).get(`${BASE}/${missingId}`);
    expect(res.status).toBe(404);
});

it("returns 400 for a malformed id", async () => {
    const res = await request(app).get(`${BASE}/not-a-uuid`);
    expect(res.status).toBe(400);
});
  });
// @end

// @method:create
describe("POST /", () => {
    it("returns 201 and the created item", async () => {
        const res = await request(app).post(BASE).send(validPayload);
        expect(res.status).toBe(201);
        expect(res.body.id).toEqual(expect.any(String));
    });

    it("returns 400 when the body is empty", async () => {
        const res = await request(app).post(BASE).send({});
        expect(res.status).toBe(400);
    });

    it("returns 400 when the body has an unknown field", async () => {
        const res = await request(app)
            .post(BASE)
            .send({ ...validPayload, unexpected: true });
        expect(res.status).toBe(400);
    });
});
// @end

// @method:update
describe("PUT /:id", () => {
    it("returns 200 and the updated item", async () => {
        const created = await {{ NAME }
    }Repository.create(validPayload);
    const res = await request(app)
        .put(`${BASE}/${created.id}`)
        .send(validPayload);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
});

it("returns 404 when the item does not exist", async () => {
    const res = await request(app)
        .put(`${BASE}/${missingId}`)
        .send(validPayload);
    expect(res.status).toBe(404);
});

it("returns 400 when the body has an unknown field", async () => {
    const created = await {{ NAME }
}Repository.create(validPayload);
const res = await request(app)
    .put(`${BASE}/${created.id}`)
    .send({ unexpected: true });
expect(res.status).toBe(400);
    });
  });
// @end

// @method:delete
describe("DELETE /:id", () => {
    it("returns 204 and removes the item", async () => {
        const created = await {{ NAME }
    }Repository.create(validPayload);
    const res = await request(app).delete(`${BASE}/${created.id}`);
    expect(res.status).toBe(204);
    expect(await {{ NAME }}Repository.findById(created.id)).toBeNull();
    });

it("returns 404 when the item does not exist", async () => {
    const res = await request(app).delete(`${BASE}/${missingId}`);
    expect(res.status).toBe(404);
});
  });
  // @end
});
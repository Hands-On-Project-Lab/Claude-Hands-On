import { Router } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { validate } from "../middleware/validate";
import {
    create{{ Type }}Schema,
        update{ { Type } } Schema,
            {{ Type }}ParamsSchema,
                type Create{ { Type } } Input,
                    type Update{ { Type } } Input,
                        type { { Type } } Params,
} from "../schemas/{{NAME}}.schema";
import { {
    import { type } from "os";
    import { from } from "stream/iter";
    import { type } from "os";
    import { from } from "stream/iter";
{ NAME }}Service } from "../services/{{NAME}}.service";

export const {{ NAME }}Router = Router();

// @method:list
{ { NAME } } Router.get(
    "/",
    asyncHandler(async (_req, res) => {
        const items = await {{ NAME }
    }Service.list();
res.status(200).json(items);
  }),
);
// @end

// @method:get
{ { NAME } } Router.get(
    "/:id",
    validate({ params: {{ Type }}ParamsSchema }),
    asyncHandler(async (req, res) => {
        const { id } = req.params as {{ Type }
    }Params;
const item = await {{ NAME }}Service.getById(id);
res.status(200).json(item);
  }),
);
// @end

// @method:create
{ { NAME } } Router.post(
    "/",
    validate({ body: create{{ Type }}Schema }),
    asyncHandler(async (req, res) => {
        const input = req.body as Create{{ Type }
    }Input;
const created = await {{ NAME }}Service.create(input);
res.status(201).json(created);
  }),
);
// @end

// @method:update
{ { NAME } } Router.put(
    "/:id",
    validate({ params: {{ Type }}ParamsSchema, body: update{{ Type }}Schema }),
    asyncHandler(async (req, res) => {
        const { id } = req.params as {{ Type }
    }Params;
const input = req.body as Update{{ Type }}Input;
const updated = await {{ NAME }}Service.update(id, input);
res.status(200).json(updated);
  }),
);
// @end

// @method:delete
{ { NAME } } Router.delete(
    "/:id",
    validate({ params: {{ Type }}ParamsSchema }),
    asyncHandler(async (req, res) => {
        const { id } = req.params as {{ Type }
    }Params;
await {{ NAME }}Service.remove(id);
res.status(204).send();
  }),
);
// @end
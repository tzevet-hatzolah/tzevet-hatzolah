import { type SchemaTypeDefinition } from "sanity";

import { blockContentType } from "./blockContentType";
import { pageType } from "./pageType";
import { newsArticleType } from "./newsArticleType";
import { fieldStoryType } from "./fieldStoryType";
import { teamMemberType } from "./teamMemberType";
import { siteSettingsType } from "./siteSettingsType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    pageType,
    newsArticleType,
    fieldStoryType,
    teamMemberType,
    siteSettingsType,
  ],
};

import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .id("root")
    .title("צוות הצלה")
    .items([
      S.listItem()
        .title("Site Settings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings")
        ),
      S.divider(),
      S.documentTypeListItem("page").title("Pages"),
      S.documentTypeListItem("newsArticle").title("News Articles"),
      S.documentTypeListItem("fieldStory").title("Field Stories"),
      S.documentTypeListItem("teamMember").title("Team Members"),
    ]);

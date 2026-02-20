import { FamilyRelationType } from "@prisma/client";

export function getInverseRelationType(type: FamilyRelationType): FamilyRelationType {
  switch (type) {
    case "SPOUSE":
      return "SPOUSE";
    case "PARENT":
      return "CHILD";
    case "CHILD":
      return "PARENT";
    case "SIBLING":
      return "SIBLING";
  }
}

export interface FamilyRelationView {
  id: string;
  relatedClientId: string;
  relatedClientName: string;
  relationType: FamilyRelationType;
}

export function buildFamilyRelations(
  clientId: string,
  relationsA: Array<{
    id: string;
    clientBId: string;
    relationType: FamilyRelationType;
    clientB: { id: string; firstName: string; lastName: string };
  }>,
  relationsB: Array<{
    id: string;
    clientAId: string;
    relationType: FamilyRelationType;
    clientA: { id: string; firstName: string; lastName: string };
  }>
): FamilyRelationView[] {
  const relations: FamilyRelationView[] = [];

  for (const rel of relationsA) {
    relations.push({
      id: rel.id,
      relatedClientId: rel.clientBId,
      relatedClientName: `${rel.clientB.firstName} ${rel.clientB.lastName}`,
      relationType: rel.relationType,
    });
  }

  for (const rel of relationsB) {
    relations.push({
      id: rel.id,
      relatedClientId: rel.clientAId,
      relatedClientName: `${rel.clientA.firstName} ${rel.clientA.lastName}`,
      relationType: getInverseRelationType(rel.relationType),
    });
  }

  return relations;
}

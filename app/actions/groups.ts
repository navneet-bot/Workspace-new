/* "use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createGroup(data: {
  name: string;
  description: string;
  icon: string;
  members: string;
  createdBy: string;
}) {
  try {
    const group = await prisma.group.create({ data });
    revalidatePath("/dashboard/groups");
    return { success: true, group };
  } catch (error) {
    return { success: false, error: "Failed to create group" };
  }
}

export async function deleteGroup(id: number) {
  try {
    await prisma.group.delete({ where: { id } });
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete group" };
  }
}

export async function renameGroup(id: number, newName: string) {
  try {
    const group = await prisma.group.update({
      where: { id },
      data: { name: newName }
    });
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");
    return { success: true, group };
  } catch (error) {
    return { success: false, error: "Failed to rename group" };
  }
}

export async function updateGroup(id: number, data: {
  name?: string;
  description?: string;
  icon?: string;
  members?: string;
}) {
  try {
    const group = await prisma.group.update({
      where: { id },
      data
    });
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");
    return { success: true, group };
  } catch (error) {
    return { success: false, error: "Failed to update group" };
  }
}
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createGroup(data: {
  name: string;
  description: string;
  icon: string;
  members: string;
  createdBy: string;
}) {
  try {
    let members: string[] = [];

    try {
      const parsed = JSON.parse(data.members || "[]");
      members = Array.isArray(parsed) ? parsed : [];
    } catch {
      members = [];
    }

    // Always add the creator as a member
    if (
      data.createdBy &&
      !members.includes(data.createdBy)
    ) {
      members.unshift(data.createdBy);
    }

    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        members: JSON.stringify(members),
        createdBy: data.createdBy,
      },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");

    return {
      success: true,
      group,
    };
  } catch (error) {
    console.error("Failed to create group:", error);

    return {
      success: false,
      error: "Failed to create group",
    };
  }
}

export async function deleteGroup(id: number) {
  try {
    await prisma.group.delete({
      where: { id },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete group:", error);

    return {
      success: false,
      error: "Failed to delete group",
    };
  }
}

export async function renameGroup(
  id: number,
  newName: string
) {
  try {
    const group = await prisma.group.update({
      where: { id },
      data: {
        name: newName,
      },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");

    return {
      success: true,
      group,
    };
  } catch (error) {
    console.error("Failed to rename group:", error);

    return {
      success: false,
      error: "Failed to rename group",
    };
  }
}

export async function updateGroup(
  id: number,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    members?: string;
  }
) {
  try {
    const existingGroup = await prisma.group.findUnique({
      where: { id },
    });

    if (!existingGroup) {
      return {
        success: false,
        error: "Group not found",
      };
    }

    let finalMembers: string[] = [];

    try {
      const parsed = JSON.parse(
        data.members ?? existingGroup.members ?? "[]"
      );

      finalMembers = Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      finalMembers = [];
    }

    // Creator can never be removed
    if (
      existingGroup.createdBy &&
      !finalMembers.includes(existingGroup.createdBy)
    ) {
      finalMembers.unshift(
        existingGroup.createdBy
      );
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...(data.icon !== undefined && {
          icon: data.icon,
        }),

        members: JSON.stringify(finalMembers),
      },
    });

    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/chat");

    return {
      success: true,
      group,
    };
  } catch (error) {
    console.error("Failed to update group:", error);

    return {
      success: false,
      error: "Failed to update group",
    };
  }
}
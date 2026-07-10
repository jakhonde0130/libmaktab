import { AppError } from "@/middleware/errorHandler.js";
import { authRepository } from "@/modules/auth/auth.repository.js";
import type { RegisterUserInput } from "@/modules/auth/auth.schema.js";
import type { AppRole } from "@/types/domain.js";

// Which roles an actor is allowed to grant when creating a new account.
// Prevents e.g. a librarian from minting themselves an administrator.
const GRANTABLE_ROLES: Record<AppRole, AppRole[]> = {
  director: ["director", "administrator", "librarian", "operator", "teacher", "reader"],
  administrator: ["librarian", "operator", "teacher", "reader"],
  librarian: ["reader"],
  operator: [],
  teacher: [],
  reader: [],
};

export const authService = {
  async registerUser(input: RegisterUserInput, actorRole: AppRole) {
    const allowed = GRANTABLE_ROLES[actorRole] ?? [];
    if (!allowed.includes(input.role)) {
      throw new AppError(`Role '${actorRole}' cannot create a '${input.role}' account`, 403, "FORBIDDEN");
    }

    return authRepository.registerUser(input);
  },
};

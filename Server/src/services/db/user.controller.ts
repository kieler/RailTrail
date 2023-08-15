import { PrismaClient, Prisma, User } from "@prisma/client";

/**
 * UserController class
 *
 * Handles user specific access to the database.
 * @functions   - save()
 *              - update()
 *              - remove()
 *              - getAll()
 *              - getById()
 *              - getByUsername()
 */
export default class UserController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Saves an user in the database.
   *
   * The parameter are given via object deconstruction from the model `User`!
   * Currently given parameters are:
   * @param username - **unique** name of the user.
   * @param password - **hashed** password.
   * @returns User
   */
  public async save(args: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data: args,
    });
  }

  /**
   * Updates an user in the database.
   *
   * @param name - Old username before change. Indicator which user should be updated
   *
   * The parameter are given via object deconstruction from the model `User`!
   * Currently given parameters are:
   * @param username - New username after change. (Optional)
   * @param password - New password after change. (Optional)
   * @returns User
   */
  public async update(
    name: string,
    args: Prisma.UserUpdateInput
  ): Promise<User> {
    return await this.prisma.user.update({
      where: {
        username: name,
      },
      data: args,
    });
  }

  /**
   * Removes an user from the database.
   *
   * @param username - Indicator which user should be removed
   */
  public async remove(username: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        username: username,
      },
    });
  }

  /**
   * Returns a list of all existing users.
   *
   * @returns `User[]` - List of all users.
   */
  public async getAll(): Promise<User[]> {
    return await this.prisma.user.findMany({});
  }

  /**
   * Looks up an user given by its username.
   *
   * @param username - Indicator which user should be searched for
   * @returns User | null depending on if the user could be found.
   */
  public async getByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        username: username,
      },
    });
  }
}

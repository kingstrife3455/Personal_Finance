
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

async function main() {
    console.log("🔐 Setup Initial User");

    const username = await question("Enter username: ");
    const password = await question("Enter password: ");

    if (!username || !password) {
        console.error("Username and password are required.");
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { username },
            update: { password: hashedPassword },
            create: {
                username,
                password: hashedPassword
            }
        });

        console.log(`✅ User '${user.username}' created/updated successfully!`);
        console.log("You can now log in at /login");
    } catch (error) {
        console.error("Error creating user:", error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

main();

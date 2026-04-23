import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();

  const board = await prisma.board.create({
    data: {
      name: 'Sprint Demo',
      description: 'Tablero de ejemplo con listas y tareas',
      lists: {
        create: [
          {
            name: 'To Do',
            position: 0,
            tasks: {
              create: [
                { title: 'Diseñar esquema de BD', status: 'DONE', position: 0 },
                { title: 'Configurar CI/CD', status: 'TODO', position: 1 },
              ],
            },
          },
          {
            name: 'Doing',
            position: 1,
            tasks: {
              create: [{ title: 'Implementar drag & drop', status: 'DOING', position: 0 }],
            },
          },
          { name: 'Done', position: 2 },
        ],
      },
    },
  });

  console.log('Seeded board:', board.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/uhui/backend/internal/audit"
	"github.com/uhui/backend/internal/config"
	"github.com/uhui/backend/internal/db/gen"
	"github.com/uhui/backend/internal/modules/auth"
)

func main() {
	_ = godotenv.Load("../.env")

	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	switch os.Args[1] {
	case "create-admin":
		runCreateAdmin(ctx, pool, os.Args[2:])
	case "set-role":
		runSetRole(ctx, pool, os.Args[2:])
	default:
		printUsage()
		os.Exit(1)
	}
}

func runCreateAdmin(ctx context.Context, pool *pgxpool.Pool, args []string) {
	fs := flag.NewFlagSet("create-admin", flag.ExitOnError)
	email := fs.String("email", "", "Admin email")
	name := fs.String("name", "", "Admin full name")
	pass := fs.String("password", "", "Admin password")
	_ = fs.Parse(args)

	if *email == "" || *name == "" || *pass == "" {
		fmt.Println("Usage: admin create-admin --email <email> --name <name> --password <password>")
		os.Exit(1)
	}

	hash, err := auth.HashPassword(*pass)
	if err != nil {
		slog.Error("failed to hash password", "error", err)
		os.Exit(1)
	}

	queries := gen.New(pool)
	user, err := queries.CreateUser(ctx, gen.CreateUserParams{
		Email:        strings.ToLower(strings.TrimSpace(*email)),
		PasswordHash: hash,
		FullName:     strings.TrimSpace(*name),
		Role:         gen.UserRoleAdmin,
		PdpConsentAt: pgtype.Timestamptz{Valid: true},
	})
	if err != nil {
		slog.Error("failed to create admin user", "error", err)
		os.Exit(1)
	}

	_, _ = audit.Record(ctx, pool, audit.Event{
		ActorID:  user.ID,
		Action:   audit.ActionRoleChanged,
		Entity:   "users",
		EntityID: user.ID,
		Meta:     map[string]any{"new_role": "admin", "reason": "initial admin setup"},
	})

	fmt.Printf("Admin user created successfully! ID: %x\n", user.ID.Bytes)
}

func runSetRole(ctx context.Context, pool *pgxpool.Pool, args []string) {
	fs := flag.NewFlagSet("set-role", flag.ExitOnError)
	email := fs.String("email", "", "Target user email")
	targetRole := fs.String("role", "", "Role (sme_owner, investor, mentor, admin)")
	_ = fs.Parse(args)

	if *email == "" || *targetRole == "" {
		fmt.Println("Usage: admin set-role --email <email> --role <role>")
		os.Exit(1)
	}

	queries := gen.New(pool)
	user, err := queries.GetUserByEmail(ctx, strings.ToLower(strings.TrimSpace(*email)))
	if err != nil {
		slog.Error("user not found", "email", *email)
		os.Exit(1)
	}

	newRole := gen.UserRole(strings.ToLower(strings.TrimSpace(*targetRole)))
	if err := queries.SetUserRole(ctx, gen.SetUserRoleParams{
		ID:   user.ID,
		Role: newRole,
	}); err != nil {
		slog.Error("failed to set user role", "error", err)
		os.Exit(1)
	}

	_, _ = audit.Record(ctx, pool, audit.Event{
		ActorID:  user.ID,
		Action:   audit.ActionRoleChanged,
		Entity:   "users",
		EntityID: user.ID,
		Meta:     map[string]any{"old_role": user.Role, "new_role": newRole},
	})

	fmt.Printf("User %s role updated to %s\n", *email, newRole)
}

func printUsage() {
	fmt.Println("UHUI Admin CLI")
	fmt.Println("Commands:")
	fmt.Println("  create-admin --email <email> --name <name> --password <password>")
	fmt.Println("  set-role     --email <email> --role <role>")
}

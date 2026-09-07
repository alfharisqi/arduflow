<?php

declare(strict_types=1);

/** Inspect a table once per group, rather than once for every optional column. */
function afwEnsureSqliteColumns(PDO $pdo, string $table, array $definitions): void
{
    $quote = static fn (string $name): string => '"' . str_replace('"', '""', $name) . '"';
    $statement = $pdo->query('PRAGMA table_info(' . $quote($table) . ')');
    $columns = [];
    while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
        $columns[(string) $row['name']] = true;
    }
    $statement->closeCursor();

    // No process-wide cache: ALTER/ROLLBACK and separate PDO connections remain safe.
    foreach ($definitions as $column => $definition) {
        if (!isset($columns[$column])) {
            $pdo->exec('ALTER TABLE ' . $quote($table) . ' ADD COLUMN ' . $quote($column) . ' ' . $definition);
        }
    }
}

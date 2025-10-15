"""Entry point for CLI application."""

from __future__ import annotations

import readline  # noqa: F401  # enables history and editing in CLI

from .app import NavigatorApp


def run() -> None:
    app = NavigatorApp()
    print(app.render())
    while True:
        try:
            command = input("nav> ")
        except (EOFError, KeyboardInterrupt):
            print("\nExiting Research Navigator.")
            break
        try:
            message = app.handle_command(command)
        except SystemExit:
            print("Goodbye!")
            break
        if message:
            print(message)
        print(app.render())


if __name__ == "__main__":
    run()


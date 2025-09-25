import pytest

from app.tictactoe.engine import available_moves, move, new_game, status

# uv run pytest to test the test cases


def test_new_game_initial_state():  # passed
    gs = new_game()
    assert gs.board == [None] * 9
    assert gs.winner is None
    assert gs.is_draw is False


def test_valid_move_and_turn_switch():  # NEED TO GET RID OF TURN SWITCH
    gs = new_game()
    gs = move(gs, 0, "X")
    # assert gs.board[0] == "X"
    # assert gs.current_player == "O"  # remove this
    assert gs.winner is None
    assert not gs.is_draw


def test_cannot_play_occupied_cell():
    gs = new_game()
    gs = move(gs, 0, "X")
    with pytest.raises(ValueError):
        move(gs, 0, "O")


def test_winning_rows_cols_diagonals():
    # Row win (top row 0,1,2)
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 3, "O")
    gs = move(gs, 1, "X")
    gs = move(gs, 4, "O")
    gs = move(gs, 2, "X")
    assert gs.winner == "X"

    # Column win
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 1, "O")
    gs = move(gs, 3, "X")
    gs = move(gs, 2, "O")
    gs = move(gs, 6, "X")
    assert gs.winner == "X"

    # Diagonal win
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 1, "O")
    gs = move(gs, 4, "X")
    gs = move(gs, 2, "O")
    gs = move(gs, 8, "X")
    assert gs.winner == "X"


def test_draw_condition():
    gs = new_game()
    # X O X
    # X X O
    # O X O
    seq = [
        (0, "X"),
        (1, "O"),
        (2, "X"),
        (3, "X"),
        (4, "X"),
        (5, "O"),
        (6, "O"),
        (7, "X"),
        (8, "O"),
    ]
    for idx, p in seq:
        gs = move(gs, idx, p)
    assert gs.is_draw is True
    assert gs.winner is None


def test_available_moves_updates():
    gs = new_game()
    assert set(available_moves(gs)) == set(range(9))
    gs = move(gs, 4, "X")
    assert 4 not in available_moves(gs)
    assert len(available_moves(gs)) == 8


def test_game_over_disallows_moves():
    gs = new_game()
    gs = move(gs, 0, "X")
    gs = move(gs, 3, "O")
    gs = move(gs, 1, "X")
    gs = move(gs, 4, "O")
    gs = move(gs, 2, "X")  # X wins
    with pytest.raises(ValueError):
        move(gs, 8, "O")


def test_cannot_override_with_dash():
    gs = new_game()
    gs = move(gs, 0, "X")
    with pytest.raises(ValueError):
        move(gs, 0, "-")


def test_dash_places_and_does_not_end_game():
    gs = new_game()
    gs = move(gs, 0, "-")  # place a dash at cell 0
    assert gs.board[0] == "-"
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "in progress"


def test_dash_three_in_a_row_is_not_a_win():
    gs = new_game()
    # Put "-" across the top row: 0,1,2
    gs = move(gs, 0, "-")
    gs = move(gs, 1, "-")
    gs = move(gs, 2, "-")
    # Even with three dashes in a row, winner must remain None
    assert gs.winner is None
    assert gs.is_draw is False
    assert status(gs) == "in progress"


def test_draw_counts_with_dashes_on_board():
    gs = new_game()
    # Fill the board with X/O/'-' so there is no X/O 3-in-a-row,
    # but the board is full -> should be a draw.
    seq = [
        (0, "X"),
        (1, "O"),
        (2, "-"),
        (3, "-"),
        (4, "O"),
        (5, "X"),
        (6, "O"),
        (7, "X"),
        (8, "-"),
    ]
    for idx, p in seq:
        gs = move(gs, idx, p)

    assert gs.is_draw is True
    assert gs.winner is None
    assert status(gs) == "draw"

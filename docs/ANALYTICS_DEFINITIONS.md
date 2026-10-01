# Cricket Intelligence — Analytics Definitions

All metrics are derived from the `deliveries` collection unless noted.

## Source Fields (Deliveries Collection)

| Field | Type | Description |
|---|---|---|
| runs_batter | Number | Runs credited to the batter |
| runs_bowler | Number | Runs charged to the bowler (excludes leg-byes/byes) |
| runs_extras | Number | Extra runs on this delivery |
| runs_total | Number | Total runs on this delivery |
| valid_ball | Number | 1 = legal delivery; 0 = wide or no-ball |
| extra_type | String | 'wide', 'noball', 'bye', 'legbye', etc. |
| bowler_wicket | Number | 1 = bowler credited with wicket |
| wicket_kind | String | 'caught', 'bowled', 'lbw', 'run out', 'stumped', etc. |
| batter | String | Batter on strike |
| bowler | String | Bowler |
| innings | Number | 1 = first innings, 2 = second innings |
| over | Number | 0-indexed (over=0 is first over, over=19 is last) |
| season | String | IPL season e.g. '2024', '2023/24' |
| batting_team | String | Team batting this delivery |
| bowling_team | String | Team bowling this delivery |
| match_id | Number | Unique match identifier |
| match_won_by | String | Winning team name |
| toss_winner | String | Toss winner name |
| toss_decision | String | 'bat' or 'field' |
| venue | String | Ground name |

---

## Metric Definitions

### Batting Strike Rate
- **Formula:** (sum(runs_batter) / count(valid_ball=1)) x 100
- **Legal balls:** only where valid_ball = 1 (wides excluded, no-balls included)
- **Null when:** legal balls faced = 0
- **Current status:** BUG - getBattingStats uses { sum: 1 } (counts all deliveries including wides)

### Batting Average
- **Formula:** sum(runs_batter) / count(dismissals)
- **Dismissals:** deliveries where player_out = batter name AND wicket_kind is not null
- **Excluded from dismissals:** run_outs of non-striker, retired hurt
- **Null when:** dismissals = 0 (return null, not 0)
- **Current status:** BUG - divides by total delivery count, not dismissal count

### Bowling Economy Rate
- **Formula:** (sum(runs_bowler) / count(valid_ball=1)) x 6
- **runs_bowler:** excludes leg-byes and byes (already correct in dataset)
- **Current status:** CORRECT (uses valid_ball filter)

### Bowling Average
- **Formula:** sum(runs_bowler) / count(bowler_wicket=1)
- **Note:** bowler_wicket field already excludes run-outs per dataset conventions
- **Null when:** wickets = 0
- **Current status:** Returns runs_conceded when wickets = 0 (acceptable fallback)

### Bowling Strike Rate
- **Formula:** count(valid_ball=1) / count(bowler_wicket=1)
- **Null when:** wickets = 0
- **Current status:** Returns 0 when wickets = 0 (acceptable)

### Dot Ball Percentage (Batting)
- **Formula:** count(valid_ball=1 AND runs_batter=0) / count(valid_ball=1) x 100
- **Note:** MUST filter valid_ball=1 to exclude wides
- **Current status:** BUG in getPlayerFullStats - does not filter valid_ball

### Dot Ball Percentage (Bowling)
- **Formula:** count(valid_ball=1 AND runs_bowler=0) / count(valid_ball=1) x 100
- **Current status:** CORRECT in specificBowlerStats

### Boundary Percentage (Batting)
- **Formula:** sum(runs_batter where runs_batter IN [4,6]) / sum(runs_batter) x 100
- **Current status:** CORRECT

### Run Rate (Innings)
- **Formula:** (sum(runs_total) / count(valid_ball=1)) x 6
- **Current status:** CORRECT in matchController/iplMatchController

### Match Intensity Classification
| Category | Condition |
|---|---|
| Very Close | Run difference <= 10 |
| Competitive | Run difference 11-30 |
| One-Sided | Run difference > 30 |

### Phase Definitions (T20)
| Phase | Over Range (0-indexed) | Overs Shown |
|---|---|---|
| Powerplay | 0-5 | Overs 1-6 |
| Middle | 6-14 | Overs 7-15 |
| Death | 15-19 | Overs 16-20 |

### Win Probability (Live Match Engine)
- **Type:** Heuristic rule-based (NOT a trained ML model)
- **Inputs:** current score, target, balls remaining, wickets remaining
- **Output:** Probability in [0.0, 1.0]
- **Limitation:** Not historically calibrated. Results are approximate.

---

## Validation Queries (run in mongosh)

```js
// Check valid_ball encoding
db.deliveries.countDocuments({ valid_ball: 0 })
db.deliveries.countDocuments({ valid_ball: 1 })

// Confirm bowler_wicket excludes run-outs
db.deliveries.countDocuments({ bowler_wicket: 1, wicket_kind: 'run out' })

// Available seasons
db.deliveries.distinct('season')

// Over range check
db.deliveries.aggregate([{ $group: { _id: null, minOver: { $min: '$over' }, maxOver: { $max: '$over' } } }])
```

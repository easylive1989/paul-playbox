import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:ray_world_game/direction.dart';

class Joypad extends StatefulWidget {
  const Joypad({
    super.key,
    required this.onJoypadDirectionChanged,
  });

  final ValueChanged<Direction> onJoypadDirectionChanged;

  @override
  State<Joypad> createState() => _JoypadState();
}

class _JoypadState extends State<Joypad> {
  Offset offset = Offset.zero;

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.grey,
          ),
        ),
        GestureDetector(
          onPanUpdate: (details) {
            var newOffsetX = details.localPosition.dx;
            var newOffsetY = details.localPosition.dy;
            setState(() {
              offset = Offset(
                clampDouble(newOffsetX, -25, 25),
                clampDouble(newOffsetY, -25, 25),
              );
            });
            bool horizontal = newOffsetX.abs() > newOffsetY.abs();
            if (horizontal) {
              widget.onJoypadDirectionChanged(newOffsetX > 0 ? Direction.right : Direction.left);
            } else {
              widget.onJoypadDirectionChanged(newOffsetY > 0 ? Direction.down : Direction.up);
            }
          },
          onPanEnd: (_) {
            widget.onJoypadDirectionChanged(Direction.none);
            setState(() => offset = Offset.zero);
          },
          child: Transform.translate(
            offset: offset,
            child: Container(
              width: 50,
              height: 50,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black,
              ),
            ),
          ),
        )
      ],
    );
  }
}

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_colors.dart';
import '../../core/navigation/root_navigator.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _master;

  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _titleSlide;
  late Animation<double> _titleFade;
  late Animation<double> _subFade;
  late Animation<double> _loaderFade;
  late Animation<double> _ringPulse;

  @override
  void initState() {
    super.initState();

    _master = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );

    _logoScale = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.0, 0.25, curve: Curves.easeOutBack)),
    );
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.0, 0.20, curve: Curves.easeOut)),
    );
    _ringPulse = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.05, 0.30, curve: Curves.easeOut)),
    );
    _titleSlide = Tween<double>(begin: 20.0, end: 0.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.25, 0.45, curve: Curves.easeOutCubic)),
    );
    _titleFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.25, 0.45, curve: Curves.easeOut)),
    );
    _subFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.40, 0.55, curve: Curves.easeOut)),
    );
    _loaderFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: _master,
          curve: const Interval(0.55, 0.70, curve: Curves.easeOut)),
    );

    _master.forward();
    Timer(const Duration(milliseconds: 2800), _navigate);
  }

  void _navigate() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const RootNavigator(),
        transitionsBuilder: (_, anim, __, child) => FadeTransition(
          opacity: CurvedAnimation(parent: anim, curve: Curves.easeInOut),
          child: child,
        ),
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  void dispose() {
    _master.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: Column(
            children: [
              const Spacer(flex: 3),
              FadeTransition(
                opacity: _logoFade,
                child: ScaleTransition(
                  scale: _logoScale,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      AnimatedBuilder(
                        animation: _ringPulse,
                        builder: (context, _) {
                          return Container(
                            width: 140 * _ringPulse.value,
                            height: 140 * _ringPulse.value,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primarySoft,
                            ),
                          );
                        },
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          shape: BoxShape.circle,
                          border:
                              Border.all(color: AppColors.border, width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.08),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 78,
                          height: 78,
                          errorBuilder: (_, __, ___) => Container(
                            width: 78,
                            height: 78,
                            decoration: BoxDecoration(
                              color: AppColors.primarySoft,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.solar_power_rounded,
                                size: 40, color: AppColors.primary),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const Spacer(flex: 2),
              FadeTransition(
                opacity: _titleFade,
                child: AnimatedBuilder(
                  animation: _titleSlide,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, _titleSlide.value),
                      child: child,
                    );
                  },
                  child: const Text(
                    'SOLAR CRM',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primaryDark,
                      letterSpacing: 3.0,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              FadeTransition(
                opacity: _subFade,
                child: const Text(
                  'Smart Sun Power Enterprise',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const Spacer(flex: 3),
              FadeTransition(
                opacity: _loaderFade,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 28),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(AppColors.primary),
                        ),
                      ),
                      SizedBox(height: 14),
                      Text(
                        'Loading Portal Session...',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMuted,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

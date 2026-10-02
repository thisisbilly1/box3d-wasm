// Exercises the native helper itself, including preservation gates. Run with
// scripts/test-contact-guards.sh after fetching dependencies and activating emsdk.
#include "../../deps/box3d/src/mesh_contact.c"
#include <stdlib.h>

static int passed;
#define CHECK( label, expression ) do { if (!(expression)) { fprintf(stderr,"FAIL: %s\n",label); exit(1); } ++passed; } while(0)

int main(void)
{
	b3LocalManifoldPoint points[2] = { { .separation = 0.0176f }, { .separation = 0.01f } };
	b3LocalManifold m = { .points = points, .pointCount = 1, .feature = b3_featureEdge3,
		.triangleFlags = b3_inverseConcaveEdge3, .triangleIndex = 1, .i1 = 1, .i2 = 2, .i3 = 3,
		.normal = {0.0f,0.2833f,0.9590f}, .triangleNormal = {0.0f,1.0f,0.0f} };
	b3LocalManifold a = { .feature = b3_featureTriangleFace, .triangleIndex = 2,
		.i1 = 1, .i2 = 3, .i3 = 4, .triangleNormal = {0.0f,0.995f,0.0998749f} };
	b3LocalManifold* accepted[] = { &a };
	CHECK("supported speculative outside-cone edge", b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	CHECK("no accepted support", !b3IsSupportedConvexEdgeGhost(&m,accepted,0));
	m.pointCount=0;
	CHECK("empty manifold", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.pointCount=1;
	points[0].separation=0.0f;
	CHECK("exact touching is preserved", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	points[0].separation=-FLT_EPSILON;
	CHECK("small overlap is preserved", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	points[0].separation=NAN;
	CHECK("invalid separation is preserved", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	points[0].separation=FLT_EPSILON;
	CHECK("strictly positive separation", b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	points[0].separation=0.0176f; points[1].separation=-0.001f; m.pointCount=2;
	CHECK("one overlapping point preserves entire manifold", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.pointCount=1;
	m.triangleFlags=0;
	CHECK("unclassified boundary edge", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.triangleFlags=b3_concaveEdge3;
	CHECK("concave transition", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.triangleFlags=b3_flatEdge3;
	CHECK("existing flat-edge behavior unchanged", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.triangleFlags=b3_inverseConcaveEdge3;
	a.i2=5;
	CHECK("one shared vertex is insufficient", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.i2=3; a.feature=b3_featureHullFace;
	CHECK("hull-face support is insufficient", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.feature=b3_featureTriangleFace; a.triangleIndex=1;
	CHECK("same triangle is insufficient", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.triangleIndex=2;
	b3Vec3 saved=m.normal;
	m.normal=m.triangleNormal;
	CHECK("first face cone boundary", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.normal=a.triangleNormal;
	CHECK("neighbor face cone boundary", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.normal=b3Normalize(b3Add(m.triangleNormal,a.triangleNormal));
	CHECK("true convex ridge inside cone", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.triangleNormal=(b3Vec3){0.0f,0.5f,0.8660254f};
	m.normal=(b3Vec3){0.0f,0.5f-4.0f*FLT_EPSILON,-0.8660254f};
	CHECK("cone boundary roundoff", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.normal.y=0.5f-32.0f*FLT_EPSILON;
	CHECK("outside numerical boundary", b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	m.normal=saved; a.triangleNormal=(b3Vec3){1.0f,0.0f,0.0f};
	CHECK("right angle is preserved", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.triangleNormal=(b3Vec3){0.0f,-1.0f,0.0f};
	CHECK("opposed faces are preserved", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.triangleNormal=(b3Vec3){0.0f,0.0f,0.0f};
	CHECK("degenerate neighboring normal", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.triangleNormal=(b3Vec3){NAN,NAN,NAN};
	CHECK("invalid neighboring normal", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	a.triangleNormal=(b3Vec3){0.0f,0.995f,0.0998749f};
	for (int feature=b3_featureNone;feature<=b3_featureVertex3;feature++) {
		if(feature>=b3_featureEdge1 && feature<=b3_featureEdge3) continue;
		m.feature=(b3TriangleFeature)feature;
		CHECK("non-edge features are preserved", !b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	}
	for(int edge=0;edge<3;edge++) {
		m.feature=(b3TriangleFeature)(b3_featureEdge1+edge); m.triangleFlags=(1<<edge)<<4;
		a.i1=edge==0?1:edge==1?2:3; a.i2=edge==0?2:edge==1?3:1; a.i3=4;
		CHECK("each exact edge feature", b3IsSupportedConvexEdgeGhost(&m,accepted,1));
	}
	printf("native contact guards: %d passed\n",passed);
	return 0;
}
